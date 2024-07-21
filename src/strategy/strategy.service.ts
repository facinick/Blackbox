import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Mutex } from 'async-mutex'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import { Equity } from 'src/data/data'
import { DataService } from 'src/data/data.service'
import { LedgersService } from 'src/ledger/ledger.service'
import { Tick } from 'src/live/live'
import { LiveService } from 'src/live/live.service'
import { AppLogger } from 'src/logger/logger.service'
import {
  ExecuteOrderDto,
  OrderManagerService,
} from 'src/order-manager/order-manager.service'
import { Holding } from 'src/portfolio/holdings/holdings'
import { PortfolioService } from 'src/portfolio/portfolio.service'
import { DerivativePosition } from 'src/portfolio/positions/positions'
import { clamp } from 'src/utils'

type ExecutionContext = {
  equity: Equity
  existingCallOption: DerivativePosition
  existingStocksQuantity: number
  cash: number
  month: ExpiryMonth
}

@Injectable()
export class StrategyService {
  private readonly tokens: Set<EquityToken | DerivativeToken> = new Set()
  private processingMutex = new Mutex()

  private readonly context: Map<EquityToken, ExecutionContext> = new Map()
  private currentToken: EquityToken | undefined

  constructor(
    private readonly liveService: LiveService,
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
    private readonly portfolioService: PortfolioService,
    private readonly ledgerService: LedgersService,
    private readonly orderManagerService: OrderManagerService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    this.portfolioService.getHoldings().forEach(({ token, tradingsymbol }) => {
      if (DataService.hasEquityInfo(tradingsymbol)) {
        this.tokens.add(token)
        this.updateCurrentToken(token)
        this.updateStrategyContext()
      }
    })
    this.liveService.subscribe(Array.from(this.tokens))
  }

  @OnEvent(LiveService.Events.Ticks)
  // @Throttle(30_000)
  private async onPriceUpdate(ticks: Tick[]) {
    const release = await this.processingMutex.acquire()

    for (const tick of ticks) {
      if (!this.tokens.has(tick.token)) {
        continue
      }

      this.updateCurrentToken(tick.token)
      const decision = await this.execute(tick)
      if (decision) {
        break
      }
    }

    release()
  }

  private execute = async ({ price, token }: Tick) => {
    let decisionMade = false

    if (this.DECISION_CESellExists()) {
      if (this.DECISION_CESelltargetHit(price)) {
        this.logger.log(
          `Call sell target HIT for ${token}@${price}, squaring off call sell`,
        )
        this.logger.log(`Current context:`, this.context.get(token))
        await this.ACTION_ExitCESell(price)
        await this.resync(false, true, true)
        decisionMade = true
      }
    } else {
      if (this.DECISION_EnoughDaysToSellCE(price)) {
        this.logger.log(`Can sell call for ${token}@${price}`)
        this.logger.log(`Current context:`, this.context.get(token))
        await this.ACTION_SellCE(price)
        await this.resync(false, true, true)
        decisionMade = true

        if (this.DECISION_ShouldSellEquity(price)) {
          this.logger.log(`Can sell equities for ${token}@${price}`)
          this.logger.log(`Current context:`, this.context.get(token))
          await this.ACTION_SellEquity(price)
          await this.resync(true, false, true)
          decisionMade = true
        }
      } else if (this.DECISION_ShouldSellEquity(price)) {
        this.logger.log(`Can sell equities for ${token}@${price}`)
        this.logger.log(`Current context:`, this.context.get(token))
        await this.ACTION_SellEquity(price)
        await this.resync(true, false, true)
        decisionMade = true
      }
    }

    return decisionMade
  }

  // DECISION BLOCKS ---------------------------------- //
  private DECISION_CESellExists = () => {
    const context = this.context.get(this.currentToken)

    const ceSellPosition = context.existingCallOption

    if (ceSellPosition) {
      return true
    }

    return false
  }

  private DECISION_CESelltargetHit = (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const ceSellPosition = context.existingCallOption

    if (!ceSellPosition) {
      return false
    }

    if (equityCmp > ceSellPosition.averagePrice + ceSellPosition.strike) {
      return true
    }

    return false
  }

  private DECISION_EnoughDaysToSellCE = (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const availableOTMCallOption = DataService.getAvailableOTMCallOptionFor(
      context.equity.tradingsymbol,
      context.month,
      equityCmp,
    )

    if (!availableOTMCallOption) {
      return false
    }

    if (
      !DataService.hasNPlusDaysToExpiry(availableOTMCallOption.tradingsymbol, 3)
    ) {
      return false
    }

    return true
  }

  private DECISION_ShouldSellEquity = (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const target = this.calculateTarget(
      context.existingStocksQuantity,
      equityCmp,
    )

    if (context.cash < target && context.existingStocksQuantity > 0) {
      return true
    }

    return false
  }
  // ---------------------------------- DECISION BLOCKS //

  // ACTION BLOCKS ---------------------------------- //
  private ACTION_SellCE = async (equityCmp: number) => {
    this.logger.debug(`ACTION: sell call`)
    const context = this.context.get(this.currentToken)

    const availableOTMCallOption = DataService.getAvailableOTMCallOptionFor(
      context.equity.tradingsymbol,
      context.month,
      equityCmp,
    )

    if (!availableOTMCallOption) {
      this.logger.error(
        `No OTM call options to sell for equity: ${this.currentToken} and for CMP: ${equityCmp}`,
      )
      return true
    }

    const ltpRecord = await this.apiService.getDerivativeLtp([
      availableOTMCallOption.tradingsymbol,
    ])

    const currentMonth = DataService.getToday().month

    this.logger.debug(`Building new order to sell call`)

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: availableOTMCallOption.tradingsymbol,
      price: ltpRecord[availableOTMCallOption.tradingsymbol].price,
      quantity: availableOTMCallOption.lotSize,
      buyOrSell: 'SELL',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_CESELL`,
    }

    this.logger.debug(`Sending new order to order manager:`, newOrder)

    await this.orderManagerService.execute([newOrder])
  }

  private ACTION_ExitCESell = async (equityCmp: number) => {
    this.logger.debug(`ACTION: exit existing call sell position`)
    const context = this.context.get(this.currentToken)

    if (!context.existingCallOption) {
      this.logger.error(`No existing call option found, why trying to exit it?`)
      return
    }

    const ltpRecord = await this.apiService.getDerivativeLtp([
      context.existingCallOption.tradingsymbol,
    ])

    const currentMonth = DataService.getToday().month

    this.logger.debug(`Building new order to exit existing call sell`)

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.existingCallOption.tradingsymbol,
      price: ltpRecord[context.existingCallOption.tradingsymbol].price,
      quantity: Math.abs(context.existingCallOption.quantity),
      buyOrSell: 'BUY',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_SQOFF`,
    }

    this.logger.debug(`Sending new order to order manager:`, newOrder)

    await this.orderManagerService.execute([newOrder])
  }

  private ACTION_SellEquity = async (equityCmp: number) => {
    this.logger.debug(`ACTION: sell equity`)
    const context = this.context.get(this.currentToken)

    const currentMonth = DataService.getToday().month

    const target = this.calculateTarget(
      context.existingStocksQuantity,
      equityCmp,
    )

    const targetQuantity = clamp(
      Math.ceil((target - context.cash) / equityCmp),
      0,
      context.existingStocksQuantity,
    )

    if (targetQuantity === 0) {
      this.logger.error(
        `Don't have enough stocks to sell for ${this.currentToken}, existing quantity: ${context.existingStocksQuantity}, need to sell: ${targetQuantity}`,
      )
      return
    }

    this.logger.debug(`Building new order sell equities`)

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.equity.tradingsymbol,
      price: equityCmp,
      quantity: targetQuantity,
      buyOrSell: 'SELL',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_EQSELL`,
    }

    this.logger.debug(`Sending new order to order manager:`, newOrder)

    await this.orderManagerService.execute([newOrder])
  }
  // ---------------------------------- ACTION BLOCKS //

  private resync = async (
    holdings: boolean,
    positions: boolean,
    balance: boolean,
  ) => {
    await this.portfolioService.syncPortfolio({
      syncBalance: balance,
      syncPositions: positions,
      syncHoldings: holdings,
    })
    await this.ledgerService.syncLedger()
    this.updateStrategyContext()
  }

  private updateCurrentToken = (token: Token) => {
    this.currentToken = token
  }

  private updateStrategyContext = async () => {
    const equityInfo = DataService.getEquityInfoFromToken(this.currentToken)

    const { tradingsymbol } = equityInfo

    const month = DataService.getToday().month
    const baseTag = `${tradingsymbol}_${month}`

    const existingCallOption =
      this.portfolioService.getOpenCESellPositionForEquity(tradingsymbol)

    const quantity =
      this.portfolioService.getHoldingQuantityForEquity(tradingsymbol)
    const cash = this.calculateNetCash(baseTag)

    const context = {
      equity: equityInfo,
      existingCallOption,
      existingStocksQuantity: quantity,
      cash,
      month,
    }

    this.context.set(this.currentToken, context)
    this.logger.log(
      `Strategy context updated. Token: ${this.currentToken}, Context:`,
      context,
    )
  }

  private calculateNetCash = (baseTag: string) => {
    const trades = this.ledgerService.getTradesByTag(baseTag)

    let pnl = 0

    for (const trade of trades) {
      if (trade.buyOrSell === 'SELL') {
        pnl += trade.averagePrice * trade.quantity
      }

      if (trade.buyOrSell === 'BUY') {
        pnl -= trade.averagePrice * trade.quantity
      }
    }

    return pnl
  }

  private calculateTarget = (
    quantity: Holding['quantity'],
    lastPrice: Tick['price'],
  ) => {
    const target = quantity * lastPrice * 0.025
    return target
  }
}
