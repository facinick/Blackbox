import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiService } from 'src/api/api.service';
import { Order, OrderTag } from 'src/order-manager/types';

export type ZOrderStatus =
  | 'COMPLETE'
  | 'REJECTED'
  | 'CANCELLED'
  | 'UPDATE'
  | 'OPEN';

export type ZOrderUpdate = {
  user_id: string;
  unfilled_quantity: number;
  app_id: number;
  checksum: string;
  placed_by: string;
  order_id: string;
  exchange_order_id: string | null;
  parent_order_id: string | null;
  status: ZOrderStatus | null;
  status_message: string | null;
  status_message_raw: string | null;
  order_timestamp: string;
  exchange_update_timestamp: string;
  exchange_timestamp: string;
  variety: string;
  exchange: string;
  tradingsymbol: string;
  instrument_token: number;
  order_type: string;
  transaction_type: string;
  validity: string;
  product: string;
  quantity: number;
  disclosed_quantity: number;
  price: number;
  trigger_price: number;
  average_price: number;
  filled_quantity: number;
  pending_quantity: number;
  cancelled_quantity: number;
  market_protection: number;
  meta: { [key: string]: any };
  tag: string | null;
  guid: string;
};

// quantity = filled + pending + cancelled

export type OrderStatus = ZOrderStatus;

export type OrderUpdate = {
  brokerOrderId: string;
  status: OrderStatus;
  tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol;
  token: EquityToken | DerivativeToken;
  buyOrSell: BuyOrSell;
  quantity: number;
  pendingQuantity: number;
  filledQuantity: number;
  cancelledQuantity: number;
  price: number;
  exchange: Exchange;
  // only in case of complete order
  averagePrice: number;
  tag: OrderTag;
};

export interface ZTick {
  instrument_token: number;
  last_price: number;
}

export interface Tick {
  token: number;
  price: number;
}

@Injectable()
export class LiveService {
  private subscribedTokens: Set<EquityToken | DerivativeToken> = new Set();

  constructor(
    private readonly apiService: ApiService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  connect = async () => {
    return new Promise((resolve, reject) => {
      console.log(`connecting ticker...`)
      this.apiService.registerForConnect(() => resolve);
      console.log(`registered for connect...`)
      this.apiService.registerForPriceUpdates(this.handleTick.bind(this));
      console.log(`registered for price updates...`)
      this.apiService.registerForOrderUpdates(this.handleOrderUpdate.bind(this));
      console.log(`registered for order updates...`)
      this.apiService.registerForError(() => reject);
      console.log(`registered for error updates...`)
      this.apiService.connectTicker();
      console.log(`attemping to connect`)
    });
  }

  private handleOrderUpdate = (update: ZOrderUpdate) => {
    switch (update.status) {
      case 'OPEN': {
        const orderUpdate: OrderUpdate = {
          brokerOrderId: update.order_id,
          tradingsymbol: update.tradingsymbol,
          token: update.instrument_token,
          price: update.price,
          averagePrice: update.average_price,
          quantity: update.quantity,
          pendingQuantity: update.pending_quantity,
          filledQuantity: update.filled_quantity,
          cancelledQuantity: update.cancelled_quantity,
          buyOrSell: update.transaction_type as BuyOrSell,
          tag: update.tag,
          exchange: update.exchange as Exchange,
          status: 'OPEN',
        };

        this.eventEmitter.emit('order.open', orderUpdate);

        break;
      }

      case 'COMPLETE': {
        const orderUpdate: OrderUpdate = {
          brokerOrderId: update.order_id,
          tradingsymbol: update.tradingsymbol,
          token: update.instrument_token,
          price: update.price,
          averagePrice: update.average_price,
          quantity: update.quantity,
          pendingQuantity: update.pending_quantity,
          filledQuantity: update.filled_quantity,
          cancelledQuantity: update.cancelled_quantity,
          buyOrSell: update.transaction_type as BuyOrSell,
          tag: update.tag,
          exchange: update.exchange as Exchange,
          status: 'COMPLETE',
        };

        this.eventEmitter.emit('order.complete', orderUpdate);

        break;
      }

      case 'CANCELLED': {
        const orderUpdate: OrderUpdate = {
          brokerOrderId: update.order_id,
          tradingsymbol: update.tradingsymbol,
          token: update.instrument_token,
          price: update.price,
          averagePrice: update.average_price,
          quantity: update.quantity,
          pendingQuantity: update.pending_quantity,
          filledQuantity: update.filled_quantity,
          cancelledQuantity: update.cancelled_quantity,
          buyOrSell: update.transaction_type as BuyOrSell,
          tag: update.tag,
          exchange: update.exchange as Exchange,
          status: 'CANCELLED',
        };

        this.eventEmitter.emit('order.cancelled', orderUpdate);

        break;
      }

      case 'REJECTED': {
        const orderUpdate: OrderUpdate = {
          brokerOrderId: update.order_id,
          tradingsymbol: update.tradingsymbol,
          token: update.instrument_token,
          price: update.price,
          averagePrice: update.average_price,
          quantity: update.quantity,
          pendingQuantity: update.pending_quantity,
          filledQuantity: update.filled_quantity,
          cancelledQuantity: update.cancelled_quantity,
          buyOrSell: update.transaction_type as BuyOrSell,
          tag: update.tag,
          exchange: update.exchange as Exchange,
          status: 'REJECTED',
        };

        this.eventEmitter.emit('order.rejected', orderUpdate);

        break;
      }

      case 'UPDATE': {
        const orderUpdate: OrderUpdate = {
          brokerOrderId: update.order_id,
          tradingsymbol: update.tradingsymbol,
          token: update.instrument_token,
          price: update.price,
          averagePrice: update.average_price,
          quantity: update.quantity,
          pendingQuantity: update.pending_quantity,
          filledQuantity: update.filled_quantity,
          cancelledQuantity: update.cancelled_quantity,
          buyOrSell: update.transaction_type as BuyOrSell,
          tag: update.tag,
          exchange: update.exchange as Exchange,
          status: 'UPDATE',
        };

        this.eventEmitter.emit('order.update', orderUpdate);

        break;
      }

      default: {
        console.log(update);
      }
    }
  }

  public subscribe = (tokens: (EquityToken | DerivativeToken)[]) => {
    for (const token of tokens) {
      if (this.subscribedTokens.has(token)) {
        continue;
      }

      this.subscribedTokens.add(token);
      this.apiService.subscribeTicker([token]);
    }
  }

  public unSubscribe = (tokens: (EquityToken | DerivativeToken)[]) => {
    for (const token of tokens) {
      if (this.subscribedTokens.has(token)) {
        this.subscribedTokens.delete(token);
        this.apiService.unsubscribeTicker([token]);
      }
    }
  }

  private handleTick = (tick: ZTick) => {
    const _tick: Tick = {
      token: tick.instrument_token,
      price: tick.last_price,
    };

    this.eventEmitter.emit('tick', _tick);
  }
}
