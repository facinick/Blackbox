import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { Holding } from './holdings';

@Injectable()
export class HoldingsService {
  private holdings: Holding[];

  constructor(private readonly apiService: ApiService) {}

  initialize = async () => {
    await this.syncHoldings();
  }

  syncHoldings = async () => {
    this.holdings = await this.apiService.getHoldings();
  }

  getHoldings = () => {
    return this.holdings;
  }
}
