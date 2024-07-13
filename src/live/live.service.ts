import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiService } from 'src/api/api.service';
import { AppLogger } from 'src/logger/logger.service';
import { OrderUpdate, Tick } from './live';

@Injectable()
export class LiveService {

  public static Events = {
    OrderUpdateOrderOpen: "live.order.open",
    OrderUpdateOrderCancelled: "live.order.cancelled",
    OrderUpdateOrderRejected: "live.order.rejected",
    OrderUpdateOrderComplete: "live.order.complete",
    OrderUpdateOrderModifiedOrPartialComplete: "live.order.modifiedOrPartial",
    Tick: "live.tick"
  }

  private subscribedTokens: Set<EquityToken | DerivativeToken> = new Set();

  constructor(
    private readonly apiService: ApiService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    return new Promise((resolve, reject) => {
      this.logger.log(`setting up ws listeners`)
      this.apiService.registerForPriceUpdates(this.handleTick);
      this.apiService.registerForOrderUpdates(this.handleOrderUpdate);
      this.apiService.registerForConnect(() => {
        this.wsConnected()
        resolve({})
      });
      this.apiService.registerForDisconnect(this.wsDisconnected);
      this.apiService.registerForError(this.wsClosedWithError);
      this.apiService.registerForClose(this.wsClosed);
      this.apiService.registerForReconnect(this.wsReconnecting);
      this.apiService.registerForNoreconnect(this.wsExhaustedReconnectionAttempts);
      this.logger.log(`connecting ticker...`)
      this.connect();
    });
  }

  private handleOrderUpdate = (update: OrderUpdate) => {

    switch (update.status) {
      case 'OPEN': {
        this.eventEmitter.emit(LiveService.Events.OrderUpdateOrderOpen, update);
        break;
      }

      case 'COMPLETE': {
        this.eventEmitter.emit(LiveService.Events.OrderUpdateOrderComplete, update);
        break;
      }

      case 'CANCELLED': {
        this.eventEmitter.emit(LiveService.Events.OrderUpdateOrderCancelled, update);
        break;
      }

      case 'REJECTED': {
        this.eventEmitter.emit(LiveService.Events.OrderUpdateOrderRejected, update);
        break;
      }

      case 'UPDATE': {
        this.eventEmitter.emit(LiveService.Events.OrderUpdateOrderComplete, update);
        break;
      }

      default: {
        this.logger.warn("unhandled order update:", update);
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

  private handleTick = (ticks: Tick[]) => {
    this.eventEmitter.emit(LiveService.Events.OrderUpdateOrderRejected, ticks);
  }

  // websocket stuff
  private wsConnected = () => {
    this.logger.log(`ws connected`)
  }

  private wsDisconnected = (error: any) => {
    this.logger.error(`ws connected`, error)
  }

  private wsClosedWithError = (error: any) => {
    this.logger.error(`ws closed`, error)
  }

  private wsClosed = () => {
    this.logger.log(`ws closed`)
  }

  private wsReconnecting = () => {
    this.logger.log(`ws reconnecting...`)
  }

  private wsExhaustedReconnectionAttempts = () => {
    this.logger.log(`ws reconnection attempts exhausted`)
  }

  public isConnected = () => {
    return this.apiService.isConnected()
  }

  private connect() {
    this.apiService.connectTicker()
  }
}
