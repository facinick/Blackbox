import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DataModule } from './data/data.module';
import { LiveModule } from './live/live.module';
import { PortfoliosModule } from './portfolio/portfolio.module';
import { LedgerModule } from './ledger/ledger.module';
import { StrategyModule } from './strategy/strategy.module';
import { AppController } from './app.controller';
import { OrderManagerModule } from './order-manager/order-manager.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    // ApiModule,
    LiveModule,
    DataModule,
    PortfoliosModule,
    OrderManagerModule,
    LedgerModule,
    StrategyModule,
  ],
  providers: [AppService],
  controllers: [AppController]
})
export class AppModule {}
