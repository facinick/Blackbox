import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ApiService } from 'src/api/api.service';
import { DataService } from 'src/data/data.service';
import { OrderUpdate } from 'src/live/live.service';
import { OrderRequest, PriceAdjustmentStrategy } from './order-manager.service';
import { PRICE_ADJUSTMENT_STRATEGY } from './price-adjustment/price-adjustment.strategy';
import { withRetry, clamp } from 'src/utils';

/*
emits:
order-handler.initial
order-handler.unknown (brokerOrderId, orderRequest)
order-handler.done (brokerOrderId, orderRequest)
*/

@Injectable()
class OrderHandler {
  // placed orders will have this not undefined
  private brokerOrderId: string;
  // retry with price adjustments
  private MAX_PRICE_ADJUSTMENT_ATTEMPTS = 3;
  private MAX_PRICE_ADJUSTMENT_TICK_MULTIPLE = 5;
  private lastPrice;
  private priceAdjustments: 0;
  private lastPriceAdjustmentTimestamp: number;
  // regularly handle this order
  private timer: NodeJS.Timeout;
  private RETRY_INTERVAL_MS = 15_000;

  private status:
    | 'initial' //
    | 'unknown' // placed and failed during modification / cancellation therefore requires manual intervention. Their current status is unknown.
    | 'done' = 'initial';

  constructor(
    private readonly orderRequest: OrderRequest,
    private readonly apiService: ApiService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(PRICE_ADJUSTMENT_STRATEGY)
    private readonly priceAdjustment: PriceAdjustmentStrategy,
    private readonly dataService: DataService,
  ) {
    this.lastPrice = orderRequest.price;
  }

  public async execute() {
    this.eventEmitter.emit(`order-handler.${this.status}`);

    try {
      this.brokerOrderId = await withRetry(this.placeOrder.bind(this));
      this.start();
    } catch (error) {
      this.status = 'done';
      this.stop();
    }
  }

  private start() {
    this.timer = setTimeout(this.manageOrder, this.RETRY_INTERVAL_MS);
  }

  private stop() {
    clearTimeout(this.timer);
    this.eventEmitter.emit(`order-handler.${this.status}`);
  }

  private async manageOrder() {
    clearTimeout(this.timer);

    // MODIFY ORDER PRICE
    if (this.priceAdjustments < this.MAX_PRICE_ADJUSTMENT_ATTEMPTS) {
      try {
        this.lastPrice = await withRetry(this.modifyOrder.bind(this));
        this.priceAdjustments++;
        this.lastPriceAdjustmentTimestamp = Date.now();
        this.timer = setTimeout(this.manageOrder, this.RETRY_INTERVAL_MS);
      } catch (error) {
        this.status = 'unknown';
        this.stop();
      }
    }

    // CANCEL ORDER
    else {
      try {
        await withRetry(this.cancelOrder.bind(this));
        this.status = 'done';
        this.stop();
      } catch (error) {
        this.status = 'unknown';
        this.stop();
      }
    }
  }

  private async placeOrder() {
    return this.apiService.placeOrder(this.orderRequest);
  }

  private async cancelOrder() {
    return this.apiService.cancelOrder({ orderId: this.brokerOrderId });
  }

  private async getNextPriceClamped() {
    const nextPrice = await this.priceAdjustment.getNextPrice(
      this.orderRequest,
      this.lastPrice,
    );

    const tickSize = this.dataService.getTickSizeForTradingsymbol(
      this.orderRequest.tradingsymbol,
    );

    const max =
      this.orderRequest.price +
      this.MAX_PRICE_ADJUSTMENT_TICK_MULTIPLE * tickSize;
    const min =
      this.orderRequest.price -
      this.MAX_PRICE_ADJUSTMENT_TICK_MULTIPLE * tickSize;

    return clamp(nextPrice, min, max);
  }

  private async modifyOrder() {
    const cappedNextPrice = await this.getNextPriceClamped();

    await this.apiService.modifyPrice({
      orderId: this.brokerOrderId,
      price: cappedNextPrice,
    });

    return cappedNextPrice;
  }

  @OnEvent('order.completed')
  onOrderCompletedEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return;
    }

    this.status = 'done';
    this.stop();
  }

  @OnEvent('order.rejected')
  onOrderRejectedEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return;
    }

    this.status = 'done';
    this.stop();
  }

  @OnEvent('order.cancelled')
  onOrderCancelledEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return;
    }

    this.status = 'done';
    this.stop();
  }

  @OnEvent('order.open')
  onOrderOpenEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return;
    }
  }

  // modified or partial filled
  @OnEvent('order.update')
  onOrderUpdateEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return;
    }
  }
}

export { OrderHandler };
