import { Module } from '@nestjs/common'
import { StrategyService } from './strategy.service'
import { PortfoliosModule } from 'src/portfolio/portfolio.module'
import { LiveModule } from 'src/live/live.module'
import { DataModule } from 'src/data/data.module'
import { LedgerModule } from 'src/ledger/ledger.module'
import { OrderManagerModule } from 'src/order-manager/order-manager.module'

@Module({
  providers: [StrategyService],
  exports: [StrategyService],
  imports: [
    PortfoliosModule,
    LiveModule,
    DataModule,
    LedgerModule,
    OrderManagerModule,
  ],
})
export class StrategyModule {}
