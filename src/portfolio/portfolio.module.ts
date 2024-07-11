import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { LedgersService } from '../ledger/ledger.service';
import { PositionsService } from './positions/positions.service';
import { HoldingsService } from './holdings/holdings.service';
import { LiveModule } from 'src/live/live.module';
import { BalancesService } from './balances/balances.service';

@Module({
  providers: [
    PortfolioService,
    BalancesService,
    PositionsService,
    HoldingsService,
  ],
  exports: [PortfolioService],
  imports: [LiveModule],
})
export class PortfoliosModule {}
