import { Module } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import {
  AdjustByTick,
  OrderHandler,
  OrderManagerService,
  OrderRequest,
  PriceAdjustmentStrategy,
} from './order-manager.service'
import { DataModule } from 'src/data/data.module'
import { PRICE_ADJUSTMENT_STRATEGY } from './price-adjustment/price-adjustment.strategy'
import { AppLogger } from 'src/logger/logger.service'
import { LiveService } from 'src/live/live.service'
import { LedgerModule } from 'src/ledger/ledger.module'

const orderHandlerFactory = {
  provide: 'OrderHandlerFactory',
  useFactory: function (
    apiService: ApiService,
    eventEmitter: EventEmitter2,
    priceAdjustmentStrategy: PriceAdjustmentStrategy,
    logger: AppLogger,
  ) {
    return function (orderRequest: OrderRequest) {
      const handler = new OrderHandler(
        orderRequest,
        apiService,
        eventEmitter,
        priceAdjustmentStrategy,
        logger,
      )

      // Subscribe to events here:
      handler.onOrderCompleteEvent = handler.onOrderCompleteEvent.bind(handler)
      handler.onOrderRejectedEvent = handler.onOrderRejectedEvent.bind(handler)
      handler.onOrderCancelledEvent =
        handler.onOrderCancelledEvent.bind(handler)

      eventEmitter.on(
        LiveService.Events.OrderUpdateOrderComplete,
        handler.onOrderCompleteEvent,
      )
      eventEmitter.on(
        LiveService.Events.OrderUpdateOrderRejected,
        handler.onOrderRejectedEvent,
      )
      eventEmitter.on(
        LiveService.Events.OrderUpdateOrderCancelled,
        handler.onOrderCancelledEvent,
      )

      return handler
    }
  },
  inject: [API_SERVICE, EventEmitter2, PRICE_ADJUSTMENT_STRATEGY, AppLogger],
}

@Module({
  imports: [DataModule, LedgerModule],
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
