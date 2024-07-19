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
import { AppService } from './app.service'

@Module({
  imports: [
    AppLoggerModule,
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    ApiModule.forRoot({
      environment: process.env.NODE_ENV === 'development' ? 'development' : process.env.NODE_ENV === 'production' ? 'production' : 'development',
      broker: 'zerodha'
    }),
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
