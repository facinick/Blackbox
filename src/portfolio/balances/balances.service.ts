import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';

type ZMargin = {
  equity: {
    enabled: boolean;
    net: number;
    available: {
      adhoc_margin: number;
      cash: number;
      opening_balance: number;
      live_balance: number;
      collateral: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
      liquid_collateral: number;
      stock_collateral: number;
      delivery: number;
    };
  };
  commodity: {
    enabled: boolean;
    net: number;
    available: {
      adhoc_margin: number;
      cash: number;
      opening_balance: number;
      live_balance: number;
      collateral: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
      liquid_collateral: number;
      stock_collateral: number;
      delivery: number;
    };
  };
};

type Balance = {
  openingBalance: number;
  cash: number;
  adhocMargin: number;
  liveBalance: number;
};

@Injectable()
export class BalancesService {
  private balances: Balance;

  constructor(private readonly apiService: ApiService) {}

  async initialize() {
    await this.syncBalances();
  }

  public async syncBalances() {
    const zBalances = await this.apiService.getMargins();

    this.processBalances(zBalances);
  }

  private processBalances(
    zBalances: Awaited<ReturnType<ApiService['getMargins']>>,
  ) {
    this.balances = {
      cash: zBalances.equity.available.cash,
      openingBalance: zBalances.equity.available.opening_balance,
      liveBalance: zBalances.equity.available.live_balance,
      adhocMargin: zBalances.equity.available.adhoc_margin,
    };
  }

  // static zBalancesToDomain(zBalance: Awaited<ReturnType<ApiService["getMargins"]>>): Balance {

  // }

  getBalances() {
    return this.balances;
  }
}
