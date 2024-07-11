import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { HoldingsService } from './holdings/holdings.service';
import { LedgersService } from '../ledger/ledger.service';
import { PositionsService } from './positions/positions.service';
import { BalancesService } from './balances/balances.service';
import { DataService } from 'src/data/data.service';
import { getDerivativeNameByEquityTradingsymbol } from 'src/data/eq_de_map';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly holdingsService: HoldingsService,
    private readonly positionsService: PositionsService,
    private readonly balanceService: BalancesService,
    private readonly dataService: DataService,
  ) {}

  async initialize() {
    this.holdingsService.initialize();

    this.positionsService.initialize();

    this.balanceService.initialize();
  }

  async syncPortfolio({
    syncHoldings = true,
    syncPositions = true,
    syncBalance = true,
  }: {
    syncHoldings: boolean;
    syncPositions: boolean;
    syncBalance: boolean;
  }) {
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

  public getPortfolio() {
    return {
      holdings: this.getHoldings(),
      positions: this.getPositions(),
      balances: this.getBalances(),
    };
  }

  public getHoldings() {
    return this.holdingsService.getHoldings();
  }

  public getHoldingsForEquity(tradingsymbol: EquityTradingsymbol) {
    return this.holdingsService
      .getHoldings()
      .filter((holding) => holding.tradingsymbol === tradingsymbol);
  }

  public getPositions() {
    return this.positionsService.getPositions();
  }

  public getBalances() {
    return this.balanceService.getBalances();
  }

  public getCallPositionsForEquityAndMonth(
    equityTradingsymbol,
    month: ExpiryMonth,
  ) {
    const positions = [];

    const allPositions = this.getPositions();

    for (const position of allPositions) {
      const derivativeName =
        getDerivativeNameByEquityTradingsymbol(equityTradingsymbol);

      // position is CE, Expiring in month, name is derivativeName
      if (
        position.name === derivativeName &&
        DataService.parseExpiry(position.expiry).month === month &&
        DataService.isCallOption(position.tradingsymbol)
      ) {
        positions.push(position);
      }
    }
    return positions;
  }
}
