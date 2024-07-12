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

const orderHandlerFactory = {
  provide: 'OrderHandlerFactory',
  useFactory: (
    apiService: ApiService,
    dataService: DataService,
    eventEmitter: EventEmitter2,
    priceAdjustmentStrategy: PriceAdjustmentStrategy,
  ) => {
    return (orderRequest: OrderRequest) => {
      return new OrderHandler(
        orderRequest,
        apiService,
        eventEmitter,
        priceAdjustmentStrategy,
        dataService,
      );
    };
  },
  inject: [ApiService, DataService, EventEmitter2, PRICE_ADJUSTMENT_STRATEGY],
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
