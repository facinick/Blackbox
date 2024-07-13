import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { Balance } from './balances';

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

  constructor(private readonly apiService: ApiService) {}

  initialize = async () => {
    await this.syncBalances();
  }

  syncBalances = async () => {
    this.balance = await this.apiService.getBalance();
  }

  getBalances = () => {
    return this.balance;
  }
}
