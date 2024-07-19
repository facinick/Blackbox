import { Injectable } from '@nestjs/common'
import { HoldingsService } from './holdings/holdings.service'
import { PositionsService } from './positions/positions.service'
import { BalancesService } from './balances/balances.service'
import { getDerivativeNameByEquityTradingsymbol } from 'src/data/eq_de_map'
import { AppLogger } from 'src/logger/logger.service'
import { Holding } from './holdings/holdings'

@Injectable()
export class PortfolioService {
  constructor(
    private readonly holdingsService: HoldingsService,
    private readonly positionsService: PositionsService,
    private readonly balanceService: BalancesService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    await this.holdingsService.initialize()
    this.logger.log(`holdings initialized`)
    await this.positionsService.initialize()
    this.logger.log(`positions initialized`)
    await this.balanceService.initialize()
    this.logger.log(`balance initialized`)
  }

  syncPortfolio = async ({
    syncHoldings = true,
    syncPositions = true,
    syncBalance = true,
  }: {
    syncHoldings: boolean
    syncPositions: boolean
    syncBalance: boolean
  }) => {
    const syncPromises: Promise<any>[] = []

    if (syncHoldings) {
      syncPromises.push(this.holdingsService.syncHoldings())
    }

    if (syncPositions) {
      syncPromises.push(this.positionsService.syncPositions())
    }

    if (syncBalance) {
      syncPromises.push(this.balanceService.syncBalances())
    }

    await Promise.all(syncPromises)
  }

  getPortfolio = () => {
    return {
      holdings: this.getHoldings(),
      positions: this.getPositions(),
      balances: this.getBalances(),
    }
  }

  getHoldings = () => {
    return this.holdingsService.getHoldings()
  }

  // todo: can this have more than one element for same trading symbol?
  getHoldingQuantityForEquity = (
    tradingsymbol: EquityTradingsymbol,
  ): Holding['quantity'] => {
    const holdings = this.holdingsService
      .getHoldings()
      .filter((holding) => holding.tradingsymbol === tradingsymbol)

    if (holdings.length === 1) {
      return holdings[0].quantity
    } else if (holdings.length === 0) {
      return 0
    } else {
      this.logger.error(`multiple holdings for ${tradingsymbol}`, holdings)
      throw new Error(`multiple holdings for ${tradingsymbol}`)
    }
  }

  getPositions = () => {
    return this.positionsService.getPositions()
  }

  getOpenDerivativePositions = () => {
    return this.positionsService.getOpenDerivativePositions()
  }

  getOpenCESellPositionForEquity = (tradingsymbol: EquityTradingsymbol) => {
    const allPositions = this.getOpenDerivativePositions()
    const ceSellPositions = allPositions.filter((position) => {
      if (
        position.quantity < 0 &&
        position.instrumentType === 'CE' &&
        position.name === getDerivativeNameByEquityTradingsymbol(tradingsymbol)
      ) {
        return position
      }
    })

    if (ceSellPositions.length === 1) {
      return ceSellPositions[0]
    } else if (ceSellPositions.length === 0) {
      return null
    } else {
      this.logger.error(
        `multiple ce sell positions for ${tradingsymbol}`,
        ceSellPositions,
      )
      throw new Error(`multiple holdings for ${tradingsymbol}`)
    }
  }

  getBalances = () => {
    return this.balanceService.getBalances()
  }

  getCallPositionsForEquityAndMonth = (
    equityTradingsymbol: EquityTradingsymbol,
    month: ExpiryMonth,
  ) => {
    const positions = []
    const allPositions = this.getOpenDerivativePositions()

    for (const position of allPositions) {
      const derivativeName =
        getDerivativeNameByEquityTradingsymbol(equityTradingsymbol)

      // position is CE, Expiring in month, name is derivativeName
      if (
        position.name === derivativeName &&
        position.expiry.month === month &&
        position.instrumentType === 'CE'
      ) {
        positions.push(position)
      }
    }
    return positions
  }

  // @OnEvent("order.*")
  // orderUpdateHandler
}
