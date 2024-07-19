import { Inject, Injectable } from '@nestjs/common'
import { DataService } from './data/data.service'
import { LedgersService } from './ledger/ledger.service'
import { LiveService } from './live/live.service'
import { PortfolioService } from './portfolio/portfolio.service'
import { StrategyService } from './strategy/strategy.service'
import { AppLogger } from './logger/logger.service'
import { API_SERVICE, ApiService } from './api/api.service'

@Injectable()
export class AppService {
  constructor(
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
    private readonly dataService: DataService,
    private readonly liveService: LiveService,
    private readonly portfolioService: PortfolioService,
    private readonly ledgerService: LedgersService,
    private readonly strategyService: StrategyService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  async initialize(accessToken: string, apiKey: string) {
    try {
      await this.apiService.initialize(accessToken, apiKey)
      this.logger.log(`API service initialised`)
      await this.dataService.initialize()
      this.logger.log(`Data service initialised`)
      await this.liveService.initialize()
      this.logger.log(`Live service initialized`)
      await this.portfolioService.initialize()
      this.logger.log(`Portfolio service initialized`)
      await this.ledgerService.initialize()
      this.logger.log(`Ledger service initialized`)
      await this.strategyService.initialize()
      this.logger.log(`Strategy service initialized`)
    } catch (error) {
      this.logger.error(`Error initializing app`, error)
    }
  }
}
