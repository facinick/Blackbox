import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inject, Injectable } from '@nestjs/common';
import { OrderHandler } from './order-handler.service';
import { AdjustByTick } from './price-adjustment/adjust-by-tick';
import { PriceAdjustmentStrategy } from './price-adjustment/price-adjustment.strategy';
import { AppLogger } from 'src/logger/logger.service';

type ExecuteOrderDto = {
  tradingsymbol: Tradingsymbol;
  price: number;
  buyOrSell: BuyOrSell;
  quantity: number;
  tag: string;
};

type OrderBookRecord = {
  brokerOrderId: string;
  action: 'placed' | 'executed' | 'cancelled';
  tradingsymbol: Tradingsymbol;
  price: number;
  quantity: number;
  buyOrSell: BuyOrSell;
};

type OrderRequest = {
  orderManagerOrderId: string;
  tradingsymbol: Tradingsymbol;
  price: number;
  quantity: number;
  buyOrSell: BuyOrSell;
  tag: string
};

/*
emits:
order-manager.started
order-manager.stopped
*/

@Injectable()
class OrderManagerService {
  
  private lock: boolean = false;
  private readonly orderBasket: Set<OrderRequest> = new Set();
  private readonly orderHandlers: Map<string, OrderHandler> = new Map();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
    @Inject('OrderHandlerFactory')
    private readonly orderHandlerFactory: (orderRequest: OrderRequest) => OrderHandler,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async execute(orderDtos: Array<ExecuteOrderDto>) {
    if (this.lock) {
      return;
    }

    this.lock = true;
    this.eventEmitter.emit('order-manager.started');

    this.initializeOrderBasket(orderDtos); // Initialize order basket with provided orders

    // ensure all orders reach completion
    this.logger.log(`starting execution of ${this.orderBasket.size} orders`, this.orderBasket.values());
    await Promise.allSettled(
      Array.from(this.orderBasket).map((orderRequest) => {
        return new Promise((resolve, reject) => {
          try {
            const handler = this.orderHandlerFactory(orderRequest);
            this.orderHandlers.set(orderRequest.orderManagerOrderId, handler);
            this.eventEmitter.on('order-handler.unknown', resolve);
            this.eventEmitter.on('order-handler.done', resolve);
            handler.execute();
          } catch (error) {
            this.logger.error('failed to create order handler', error);
            reject(error);
          }
        });
      }),
    );

    this.logger.log(`finished execution of ${this.orderBasket.size} orders`);
    this.lock = false;
    this.eventEmitter.emit('order-manager.stopped');
  }

  private initializeOrderBasket(orderDtos: Array<ExecuteOrderDto>) {
    orderDtos.forEach((orderDto, index) => {
      this.orderBasket.add({
        ...orderDto,
        orderManagerOrderId: String(index),
      });
    });
  }
}

export {
  OrderManagerService,
  ExecuteOrderDto,
  AdjustByTick,
  OrderRequest,
  type PriceAdjustmentStrategy,
  OrderHandler,
};
