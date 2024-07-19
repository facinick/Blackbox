import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { DataModule } from './data/data.module'
import { LiveModule } from './live/live.module'
import { PortfoliosModule } from './portfolio/portfolio.module'
import { LedgerModule } from './ledger/ledger.module'
import { StrategyModule } from './strategy/strategy.module'
import { AppController } from './app.controller'
import { OrderManagerModule } from './order-manager/order-manager.module'
import { AppLoggerModule } from './logger/logger.module'
import { ApiModule } from './api/api.module'
import { TokenService } from './token.service'
import { PrismaModule } from './prisma/prisma.module'
import { ZerodhaApiService } from './api/zerodha.api.service'
import { API_SERVICE } from './api/api.service'
import { AppService } from './app.service'

@Module({
  imports: [
    AppLoggerModule, // for root
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    ApiModule, // for root
    LiveModule,
    DataModule,
    PortfoliosModule,
    OrderManagerModule,
    LedgerModule,
    StrategyModule,
  ],
  providers: [AppService, TokenService],
  controllers: [AppController],
})
export class AppModule {}
