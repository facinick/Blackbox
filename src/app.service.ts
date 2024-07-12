import { Injectable } from '@nestjs/common';
import { DataService } from './data/data.service';
import { OrderManagerService } from './order-manager/order-manager.service';
import { LedgersService } from './ledger/ledger.service';
import { LiveService } from './live/live.service';
import { PortfolioService } from './portfolio/portfolio.service';
import { StrategyService } from './strategy/strategy.service';
import { AuthService } from './auth/auth.service';

@Injectable()
export class AppService {
  constructor(
    // private readonly apiService: ApiService,
    private readonly authService: AuthService,
    private readonly dataService: DataService,
    private readonly liveService: LiveService,
    private readonly portfolioService: PortfolioService,
    private readonly ledgerService: LedgersService,
    private readonly strategyService: StrategyService,
    private readonly orderManagerService: OrderManagerService,
  ) { }

  // assuming we are authenticated, and ticker is setup by now
  async initialize() {
    await this.dataService.initialize();
    console.log(`data service initialized`)
    // await this.liveService.connect();
    console.log(`live service initialized`)
    await this.portfolioService.initialize();
    console.log(`portfolio service initialized`)
    await this.ledgerService.initialize();
    console.log(`ledger service initialized`)
    await this.strategyService.initialize();
    console.log(`strategy service initialized`)
  }
}
