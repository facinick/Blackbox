import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import {
  DataService,
} from 'src/data/data.service';
import { LiveService } from 'src/live/live.service';
import { PortfolioService } from 'src/portfolio/portfolio.service';
import { OnEvent } from '@nestjs/event-emitter';
import { LedgersService } from 'src/ledger/ledger.service';
import { DerivativePosition } from 'src/portfolio/positions/positions';
import {
  ExecuteOrderDto,
  OrderManagerService,
} from 'src/order-manager/order-manager.service';
import { Equity } from 'src/data/data';
import { Tick } from 'src/live/live';
import { AppLogger } from 'src/logger/logger.service';
import { clamp, throttle } from 'src/utils';
import { Holding } from 'src/portfolio/holdings/holdings';

enum STAGE {
  SCAN, // process price updates, check if decision can be made
  LOCK, // a decision can be made, so we won't process any more udpates.
}

type ExecutionContext = {
  equity: Equity
  existingCallOption: DerivativePosition
  existingStocksQuantity: number
  cash: number
  month: ExpiryMonth
}

// todo: strategy interface, multiple strategies managed by this service
@Injectable()
export class StrategyService {
  private readonly tokens: Set<EquityToken | DerivativeToken> = new Set();
  private sExecStg: STAGE = STAGE.SCAN;

  private readonly context: Map<EquityToken, ExecutionContext> = new Map()
  private currentToken: EquityToken | undefined

  constructor(
    private readonly liveService: LiveService,
    private readonly apiService: ApiService,
    private readonly portfolioService: PortfolioService,
    private readonly ledgerService: LedgersService,
    private readonly orderManagerService: OrderManagerService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
    this.onPriceUpdate = throttle(this.onPriceUpdate.bind(this), 30_000)
  }

  initialize = async () => {
    this.portfolioService
      .getHoldings()
      .forEach(({ token, tradingsymbol }) => {
        if (DataService.hasEquityInfo(tradingsymbol)) {
          this.tokens.add(token)
          this.logger.log(`current token: ${token}`)
          this.currentToken = token
          this.updateStrategyContext()
        }
      });
    this.liveService.subscribe(Array.from(this.tokens));
  }


  // for now, sequentially check for every token recieved in the tick
  @OnEvent(LiveService.Events.Ticks)
  private onPriceUpdate(ticks: Tick[]): void {

    if (this.sExecStg === STAGE.LOCK) {
      return
    }

    for (const tick of ticks) {
      if (!this.tokens.has(tick.token)) {
        continue;
      }

      this.currentToken = tick.token
      this.logger.log(`current token: ${tick.token}`)
      if (this.strategyConditionTrue(tick.price) && this.sExecStg === STAGE.SCAN) {
        this.sExecStg = STAGE.LOCK
        this.executeStrategy(tick)
        break;
      }

    }
  }


  executeStrategy = async ({ price }: Tick) => {

    if (this.DECISION_CESellExists() && this.DECISION_CESelltargetHit(price)) {
      await this.ACTION_ExitCESell(price)
      await this.resync(false, true, true)
      this.updateStrategyContext()

    } else {

      if (this.DECISION_EnoughDaysToSellCE(price)) {
        await this.ACTION_SellCE(price)
        await this.resync(false, true, true)
        this.updateStrategyContext()

        if (this.DECISION_ShouldSellEquity(price)) {
          await this.ACTION_SellEquity(price)
          await this.resync(true, false, true)
          this.updateStrategyContext()
        }

      } else if (this.DECISION_ShouldSellEquity(price)) {
        await this.ACTION_SellEquity(price)
        await this.resync(true, false, true)
        this.updateStrategyContext()
      }
    }
  }


  strategyConditionTrue = (equityCmp: number) => {
    return (
      (this.DECISION_CESellExists() && this.DECISION_CESelltargetHit(equityCmp)) ||
      (this.DECISION_EnoughDaysToSellCE(equityCmp)) ||
      (this.DECISION_ShouldSellEquity(equityCmp))
    )
  }

  DECISION_CESellExists = () => {
    const context = this.context.get(this.currentToken)

    const ceSellPosition = context.existingCallOption

    if (ceSellPosition) {
      return true
    }

    return false
  }

  DECISION_CESelltargetHit = (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const ceSellPosition = context.existingCallOption

    if (!ceSellPosition) {
      return false
    }

    if (ceSellPosition.averagePrice + ceSellPosition.strike > equityCmp) {
      return true
    }

    return false
  }

  DECISION_EnoughDaysToSellCE = (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const availableOTMCallOption = DataService.getAvailableOTMCallOptionFor(
      context.equity.tradingsymbol,
      context.month,
      equityCmp)

    if (!availableOTMCallOption) {
      this.logger.warn(`no OTM call options to sell for equity: ${this.currentToken} and for cmp: ${equityCmp}`)
      return false
    }

    if (!DataService.hasNPlusDaysToExpiry(availableOTMCallOption.tradingsymbol, 3)) {
      this.logger.warn(`not enough days left to expiry of available OTM call option, cant sell`)
      return false
    }

    return true
  }

  DECISION_ShouldSellEquity = (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const target = this.calculateTarget(context.existingStocksQuantity, equityCmp)

    if (context.cash < target && context.existingStocksQuantity > 0) {
      return true
    }

    return false
  }



  ACTION_SellCE = async (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const availableOTMCallOption = DataService.getAvailableOTMCallOptionFor(
      context.equity.tradingsymbol,
      context.month,
      equityCmp)

    if (!availableOTMCallOption) {
      this.logger.warn(`no OTM call options to sell for equity: ${this.currentToken} and for cmp: ${equityCmp}`)
      return true
    }

    const ltpRecord = await this.apiService.getDerivativeLtp(
      [availableOTMCallOption.tradingsymbol]
    );

    const currentMonth = DataService.getToday().month

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.existingCallOption.tradingsymbol,
      price: ltpRecord[availableOTMCallOption.tradingsymbol].price,
      quantity: availableOTMCallOption.lotSize,
      buyOrSell: 'SELL',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_CESELL`
    };

    this.logger.log(`order to execute:`, newOrder)

    await this.orderManagerService.execute([newOrder]);
  }

  ACTION_ExitCESell = async (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const availableOTMCallOption = DataService.getAvailableOTMCallOptionFor(
      context.equity.tradingsymbol,
      context.month,
      equityCmp)

    if (!availableOTMCallOption) {
      this.logger.warn(`no OTM call options to sell for equity: ${this.currentToken} and for cmp: ${equityCmp}`)
      return true
    }

    const ltpRecord = await this.apiService.getDerivativeLtp(
      [availableOTMCallOption.tradingsymbol]
    );

    const currentMonth = DataService.getToday().month

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.existingCallOption.tradingsymbol,
      price:
        ltpRecord[context.existingCallOption.tradingsymbol]
          .price,
      quantity: context.existingCallOption.quantity,
      buyOrSell: 'BUY',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_SQOFF`
    };

    await this.orderManagerService.execute([newOrder]);
  }

  ACTION_SellEquity = async (equityCmp: number) => {
    const context = this.context.get(this.currentToken)

    const currentMonth = DataService.getToday().month

    const target = this.calculateTarget(context.existingStocksQuantity, equityCmp)

    const targetQuantity = clamp(
      Math.ceil((target - context.cash) / equityCmp), 
      0, 
      context.existingStocksQuantity);

    if (targetQuantity === 0) {
      this.logger.warn(`dont have enough stocks to sell for ${this.currentToken}, existing quantity: ${context.existingStocksQuantity}, need to sell: ${targetQuantity}`)
      return;
    }

    const newOrder: ExecuteOrderDto = {
      tradingsymbol: context.equity.tradingsymbol,
      price: equityCmp,
      quantity: targetQuantity,
      buyOrSell: 'SELL',
      tag: `${context.equity.tradingsymbol}_${currentMonth}_EQSELL`
    };

    await this.orderManagerService.execute([newOrder]);
  }





  private resync = async (holdings, positions, balance) => {
    await this.portfolioService.syncPortfolio({
      syncBalance: balance,
      syncPositions: positions,
      syncHoldings: holdings,
    });
  }

  private updateStrategyContext = async () => {

    this.logger.debug(`getting equity info for token: ${this.currentToken}`)
    const equityInfo = DataService.getEquityInfoFromToken(this.currentToken);

    const {tradingsymbol} = equityInfo

    const month = DataService.getToday().month;
    const baseTag = `${tradingsymbol}_${month}`

    const existingCallOption = this.portfolioService.getOpenCESellPositionForEquity(tradingsymbol)

    const quantity = this.portfolioService.getHoldingQuantityForEquity(tradingsymbol)
    const cash = this.calculateNetCash(baseTag)

    const context = {
      equity: equityInfo,
      existingCallOption,
      existingStocksQuantity: quantity,
      cash,
      month
    }

    this.context.set(this.currentToken, context)
    this.logger.log(`strategy context updated. token: ${this.currentToken}, context:`, context)

  }

  private calculateNetCash = (baseTag: string) => {
    const trades = this.ledgerService.getTradesByTag(baseTag);

    let pnl = 0;

    for (const trade of trades) {
      if (trade.buyOrSell === 'SELL') {
        pnl += trade.averagePrice * trade.quantity;
      }

      if (trade.buyOrSell === 'BUY') {
        pnl -= trade.averagePrice * trade.quantity;
      }
    }

    return pnl;
  }

  private calculateTarget = (quantity: Holding['quantity'], lastPrice: Tick['price']) => {
    const target = quantity * lastPrice
    return target
  }

}


// tag: ITC_JUL_CESELL <-> map position
// tag: ITC_JUL_SQOFF <-> map position
// tag: ITC_JUL_EQSELL <-> map position
