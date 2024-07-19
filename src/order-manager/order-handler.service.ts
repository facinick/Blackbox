import { Injectable, Inject } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import { DataService } from 'src/data/data.service'
import { LiveService } from 'src/live/live.service'
import { OrderRequest, PriceAdjustmentStrategy } from './order-manager.service'
import { PRICE_ADJUSTMENT_STRATEGY } from './price-adjustment/price-adjustment.strategy'
import { withRetry, clamp } from 'src/utils'
import { AppLogger } from 'src/logger/logger.service'
import { OrderUpdate } from 'src/live/live'

/*
emits:
order-handler.initial
order-handler.unknown (brokerOrderId, orderRequest)
order-handler.done (brokerOrderId, orderRequest)
*/

@Injectable()
class OrderHandler {
  public static Events = {
    OrderHandlerInitial: 'order-handler.initial',
    OrderHandlerUnknown: 'order-handler.unknown',
    OrderHandlerDone: 'order-handler.done',
  }

  // placed orders will have this not undefined
  private brokerOrderId: string
  // retry with price adjustments
  private MAX_PRICE_ADJUSTMENT_ATTEMPTS: number = 3
  private MAX_PRICE_ADJUSTMENT_TICK_MULTIPLE: number = 5
  private lastPrice: number
  private priceAdjustments: number = 0
  private lastPriceAdjustmentTimestamp: number
  // regularly handle this order
  private timer: NodeJS.Timeout
  private RETRY_INTERVAL_MS: number = 15_000

  private status:
    | 'initial' //
    | 'unknown' // placed and failed during modification / cancellation therefore requires manual intervention. Their current status is unknown.
    | 'done' = 'initial'

  constructor(
    private readonly orderRequest: OrderRequest,
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(PRICE_ADJUSTMENT_STRATEGY)
    private readonly priceAdjustment: PriceAdjustmentStrategy,
    private readonly logger: AppLogger,
  ) {
    this.lastPrice = orderRequest.price
    this.logger.setContext(
      `${this.constructor.name} ${(Math.random() * 1000).toFixed(0)}`,
    )
  }

  public execute = async () => {
    this.logger.log(`executing order`)
    this.eventEmitter.emit(`order-handler.${this.status}`)
    try {
      this.start()
      this.brokerOrderId = (await withRetry<Awaited<ReturnType<OrderHandler['placeOrder']>>>(this.placeOrder.bind(this))).brokerOrderId
    } catch (error) {
      console.error(`failed`, error)
      this.status = 'done'
      this.stop()
    }
  }

  private start = () => {
    this.logger.log(`starting order handler timer`)
    this.timer = setTimeout(this.manageOrder, this.RETRY_INTERVAL_MS)
  }

  private stop = () => {
    this.logger.log(`stopping order handler timer`)
    clearTimeout(this.timer)
    this.eventEmitter.emit(`order-handler.${this.status}`)
  }

  private manageOrder = async () => {
    this.logger.log(`${this.RETRY_INTERVAL_MS} ms passed since placing order, order not completed yet, managing.`)
    clearTimeout(this.timer)

    // MODIFY ORDER PRICE
    if (this.priceAdjustments < this.MAX_PRICE_ADJUSTMENT_ATTEMPTS) {
      try {
        this.lastPrice = await withRetry<Awaited<ReturnType<OrderHandler['modifyOrder']>>>(this.modifyOrder.bind(this))
        this.priceAdjustments++
        this.lastPriceAdjustmentTimestamp = Date.now()
        this.timer = setTimeout(this.manageOrder, this.RETRY_INTERVAL_MS)
      } catch (error) {
        this.status = 'unknown'
        this.stop()
      }
    }

    // CANCEL ORDER
    else {
      try {
        await withRetry<Awaited<ReturnType<OrderHandler['cancelOrder']>>>(this.cancelOrder.bind(this))
        this.status = 'done'
        this.stop()
      } catch (error) {
        this.status = 'unknown'
        this.stop()
      }
    }
  }

  private placeOrder = async () => {
    return this.apiService.placeOrder(this.orderRequest)
  }

  private cancelOrder = async () => {
    return this.apiService.cancelOrder({ orderId: this.brokerOrderId })
  }

  private getNextPriceClamped = async () => {
    const nextPrice = await this.priceAdjustment.getNextPrice(
      this.orderRequest,
      this.lastPrice,
    )

    const tickSize = DataService.getTickSizeForTradingsymbol(
      this.orderRequest.tradingsymbol,
    )

    const max =
      this.orderRequest.price +
      this.MAX_PRICE_ADJUSTMENT_TICK_MULTIPLE * tickSize
    const min =
      this.orderRequest.price -
      this.MAX_PRICE_ADJUSTMENT_TICK_MULTIPLE * tickSize

    return clamp(nextPrice, min, max)
  }

  private modifyOrder = async () => {
    const cappedNextPrice = await this.getNextPriceClamped()

    await this.apiService.modifyOrderPrice({
      orderId: this.brokerOrderId,
      price: cappedNextPrice,
    })

    return cappedNextPrice
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderComplete)
  onOrderCompletedEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    this.status = 'done'
    this.stop()
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderRejected)
  onOrderRejectedEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    this.status = 'done'
    this.stop()
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderCancelled)
  onOrderCancelledEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    this.status = 'done'
    this.stop()
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderOpen)
  onOrderOpenEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }
  }

  // modified or partial filled
  @OnEvent(LiveService.Events.OrderUpdateOrderModifiedOrPartialComplete)
  onOrderUpdateEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }
  }
}

export { OrderHandler }
