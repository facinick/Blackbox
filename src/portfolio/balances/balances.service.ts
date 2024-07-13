import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { Balance } from './balances';
import { AppLogger } from 'src/logger/logger.service';

// type ZMargin = {
//   equity: {
//     enabled: boolean;
//     net: number;
//     available: {
//       adhoc_margin: number;
//       cash: number;
//       opening_balance: number;
//       live_balance: number;
//       collateral: number;
//       intraday_payin: number;
//     };
//     utilised: {
//       debits: number;
//       exposure: number;
//       m2m_realised: number;
//       m2m_unrealised: number;
//       option_premium: number;
//       payout: number;
//       span: number;
//       holding_sales: number;
//       turnover: number;
//       liquid_collateral: number;
//       stock_collateral: number;
//       delivery: number;
//     };
//   };
//   commodity: {
//     enabled: boolean;
//     net: number;
//     available: {
//       adhoc_margin: number;
//       cash: number;
//       opening_balance: number;
//       live_balance: number;
//       collateral: number;
//       intraday_payin: number;
//     };
//     utilised: {
//       debits: number;
//       exposure: number;
//       m2m_realised: number;
//       m2m_unrealised: number;
//       option_premium: number;
//       payout: number;
//       span: number;
//       holding_sales: number;
//       turnover: number;
//       liquid_collateral: number;
//       stock_collateral: number;
//       delivery: number;
//     };
//   };
// };

@Injectable()
export class BalancesService {
  private balance: Balance;

  constructor(
    private readonly apiService: ApiService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    this.logger.log(`inintializing balances service`)
    await this.syncBalances();
  }

  syncBalances = async () => {
    this.balance = await this.apiService.getBalance();
    this.logger.log(`balance updated:`,this.balance)
  }

  getBalances = () => {
    return this.balance;
  }
}
