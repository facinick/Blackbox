import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiModule } from 'src/api/api.module';
import { ApiService } from 'src/api/api.service';
import { DataService } from 'src/data/data.service';
import {
  AdjustByTick,
  OrderHandler,
  OrderManagerService,
  OrderRequest,
  PriceAdjustmentStrategy,
} from './order-manager.service';
import { DataModule } from 'src/data/data.module';
import { PRICE_ADJUSTMENT_STRATEGY } from './price-adjustment/price-adjustment.strategy';
import { AppLogger } from 'src/logger/logger.service';

const orderHandlerFactory = {
  provide: 'OrderHandlerFactory',
  useFactory: function (
    apiService: ApiService,
    eventEmitter: EventEmitter2,
    priceAdjustmentStrategy: PriceAdjustmentStrategy,
    logger: AppLogger,
  ){
    return function (orderRequest: OrderRequest){
      return new OrderHandler(
        orderRequest,
        apiService,
        eventEmitter,
        priceAdjustmentStrategy,
        logger,
      );
    };
  },
  inject: [ApiService, EventEmitter2, PRICE_ADJUSTMENT_STRATEGY, AppLogger],
};

@Module({
  imports: [ApiModule, DataModule],
  providers: [
    OrderManagerService,
    orderHandlerFactory,
    {
      provide: PRICE_ADJUSTMENT_STRATEGY,
      useClass: AdjustByTick,
    },
  ],
  exports: [OrderManagerService],
})
export class OrderManagerModule {}
