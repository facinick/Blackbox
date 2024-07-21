import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import { AppLogger } from 'src/logger/logger.service'
import { OrderUpdate, Tick } from './live'

@Injectable()
export class LiveService {
  public static Events = {
    OrderUpdateOrderOpen: 'live.order.open',
    OrderUpdateOrderCancelled: 'live.order.cancelled',
    OrderUpdateOrderRejected: 'live.order.rejected',
    OrderUpdateOrderComplete: 'live.order.complete',
    OrderUpdateOrderModifiedOrPartialComplete: 'live.order.modifiedOrPartial',
    OrderUpdateOrderUnknown: 'live.order.unknown',
    Ticks: 'live.ticks',
  }

  private subscribedTokens: Set<EquityToken | DerivativeToken> = new Set()

  constructor(
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    return new Promise((resolve, reject) => {
      this.logger.log(`Setting up live data listeners`)
      this.apiService.registerForPriceUpdates(this.handleTick.bind(this))
      this.apiService.registerForOrderUpdates(this.handleOrderUpdate.bind(this))
      this.apiService.registerForConnect(() => {
        this.wsConnected()
        resolve({})
      })
      this.apiService.registerForDisconnect(this.wsDisconnected.bind(this))
      this.apiService.registerForError(this.wsClosedWithError.bind(this))
      this.apiService.registerForClose(this.wsClosed.bind(this))
      this.apiService.registerForReconnect(this.wsReconnecting.bind(this))
      this.apiService.registerForNoreconnect(
        this.wsExhaustedReconnectionAttempts.bind(this),
      )
      this.logger.log(`Connecting ticker...`)
      this.connect()
    })
  }

  private handleOrderUpdate = (update: OrderUpdate) => {
    switch (update.status) {
      case 'OPEN': {
        this.eventEmitter.emit(LiveService.Events.OrderUpdateOrderOpen, update)
        break
      }

      case 'COMPLETE': {
        this.eventEmitter.emit(
          LiveService.Events.OrderUpdateOrderComplete,
          update,
        )
        break
      }

      case 'CANCELLED': {
        this.eventEmitter.emit(
          LiveService.Events.OrderUpdateOrderCancelled,
          update,
        )
        break
      }

      case 'REJECTED': {
        this.eventEmitter.emit(
          LiveService.Events.OrderUpdateOrderRejected,
          update,
        )
        break
      }

      case 'UPDATE': {
        this.eventEmitter.emit(
          LiveService.Events.OrderUpdateOrderModifiedOrPartialComplete,
          update,
        )
        break
      }

      default: {
        this.logger.warn('Unhandled order update:', update)
        this.eventEmitter.emit(
          LiveService.Events.OrderUpdateOrderUnknown,
          update,
        )
      }
    }
  }

  public subscribe = (tokens: (EquityToken | DerivativeToken)[]) => {
    for (const token of tokens) {
      if (this.subscribedTokens.has(token)) {
        continue
      }

      this.subscribedTokens.add(token)
      this.apiService.subscribeTicker([token])
      this.logger.log(`Subscribed to: ${token}`)
    }
  }

  public unSubscribe = (tokens: (EquityToken | DerivativeToken)[]) => {
    for (const token of tokens) {
      if (this.subscribedTokens.has(token)) {
        this.subscribedTokens.delete(token)
        this.apiService.unsubscribeTicker([token])
        this.logger.log(`Unsubscribed from: ${token}`)
      }
    }
  }

  private handleTick = (ticks: Tick[]) => {
    this.eventEmitter.emit(LiveService.Events.Ticks, ticks)
  }

  // websocket stuff
  private wsConnected = () => {
    this.logger.log(`Websocket connected`)
  }

  private wsDisconnected = (error: any) => {
    this.logger.error(`Websocket disconnected`, error)
  }

  private wsClosedWithError = (error: any) => {
    this.logger.error(`Websocket closed`, error)
  }

  private wsClosed = () => {
    this.logger.log(`Websocket closed`)
  }

  private wsReconnecting = () => {
    this.logger.log(`Websocket reconnecting...`)
  }

  private wsExhaustedReconnectionAttempts = () => {
    this.logger.log(`Websocket reconnection attempts exhausted`)
  }

  public isConnected = () => {
    return this.apiService.isConnected()
  }

  private connect() {
    this.apiService.connectTicker()
  }
}
