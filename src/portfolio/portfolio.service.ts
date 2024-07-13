import { Injectable } from '@nestjs/common';
import { HoldingsService } from './holdings/holdings.service';
import { PositionsService } from './positions/positions.service';
import { BalancesService } from './balances/balances.service';
import { getDerivativeNameByEquityTradingsymbol } from 'src/data/eq_de_map';
import { AppLogger } from 'src/logger/logger.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly holdingsService: HoldingsService,
    private readonly positionsService: PositionsService,
    private readonly balanceService: BalancesService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    await this.holdingsService.initialize();
    this.logger.log(`holdings initialized`)
    await this.positionsService.initialize();
    this.logger.log(`positions initialized`)
    await this.balanceService.initialize();
    this.logger.log(`balance initialized`)
  }

  syncPortfolio = async ({
    syncHoldings = true,
    syncPositions = true,
    syncBalance = true,
  }: {
    syncHoldings: boolean;
    syncPositions: boolean;
    syncBalance: boolean;
  }) => {
    const syncPromises: Promise<any>[] = [];

    if (syncHoldings) {
      syncPromises.push(this.holdingsService.syncHoldings());
    }

    if (syncPositions) {
      syncPromises.push(this.positionsService.syncPositions());
    }

    if (syncBalance) {
      syncPromises.push(this.balanceService.syncBalances());
    }

    await Promise.all(syncPromises);
  }

  getPortfolio = () => {
    return {
      holdings: this.getHoldings(),
      positions: this.getPositions(),
      balances: this.getBalances(),
    };
  }

  getHoldings = () => {
    return this.holdingsService.getHoldings();
  }

  getHoldingsForEquity = (tradingsymbol: EquityTradingsymbol) => {
    return this.holdingsService
      .getHoldings()
      .filter((holding) => holding.tradingsymbol === tradingsymbol);
  }

  getPositions = () => {
    return this.positionsService.getPositions();
  }

  getOpenDerivativePositions = () => {
    return this.positionsService.getOpenDerivativePositions();
  }

  getBalances = () => {
    return this.balanceService.getBalances();
  }

  getCallPositionsForEquityAndMonth = (equityTradingsymbol: EquityTradingsymbol, month: ExpiryMonth) => {
    const positions = [];
    const allPositions = this.getOpenDerivativePositions();

    for (const position of allPositions) {
      const derivativeName = getDerivativeNameByEquityTradingsymbol(equityTradingsymbol);

      // position is CE, Expiring in month, name is derivativeName
      if (
        position.name === derivativeName &&
        position.expiry.month === month &&
        position.instrumentType === "CE"
      ) {
        positions.push(position);
      }
    }
    return positions;
  }

  // @OnEvent("order.*") 
  // orderUpdateHandler
}
