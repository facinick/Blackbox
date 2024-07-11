import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { PortfoliosModule } from 'src/portfolio/portfolio.module';
import { OrderBuilderService } from './order-builder.service';

@Module({
  providers: [StrategyService, OrderBuilderService],
  exports: [StrategyService],
  imports: [PortfoliosModule],
})
export class StrategyModule {}
