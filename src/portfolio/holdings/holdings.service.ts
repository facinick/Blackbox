import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { Holding } from './holdings';
import { AppLogger } from 'src/logger/logger.service';

@Injectable()
export class HoldingsService {
  private holdings: Holding[];

  constructor(
    private readonly apiService: ApiService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    this.logger.log(`inintializing holdings service`)
    await this.syncHoldings();
  }

  syncHoldings = async () => {
    this.holdings = await this.apiService.getHoldings();
    this.logger.log(`holdings updated:`,this.holdings)
  }

  getHoldings = () => {
    return this.holdings;
  }
}
