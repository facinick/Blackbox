import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import { DataService } from 'src/data/data.service'
import { OrderUpdate } from 'src/live/live'
import { LiveService } from 'src/live/live.service'
import { AppLogger } from 'src/logger/logger.service'
import { clamp, doNothing, withRetry } from 'src/utils'
import { Trade } from './order'
import { OrderRequest, PriceAdjustmentStrategy } from './order-manager.service'
import { PRICE_ADJUSTMENT_STRATEGY } from './price-adjustment/price-adjustment.strategy'

/*
emits:
// order was never placed, so no brokerId
order-handler.failed (brokerOrderId, orderRequest)
// order was palceed, and somehow handled
order-handler.handled (brokerOrderId, orderRequest)
// order was palced, not handled so must be manually handled
order-handler.not-handled (brokerOrderId, orderRequest)
*/

export type OrderHandlerEventData = {
  brokerOrderId: string | null
  orderRequest: OrderRequest
  averagePrice: number
  filledQuantity: number
}

@Injectable()
class OrderHandler {
  public static readonly Events = {
    OrderHandlerFailed: 'order-handler.failed',
    OrderHandlerHandled: 'order-handler.handled',
    OrderHandlerNotHandled: 'order-handler.not-handled',
  }

  // placed orders will have this not undefined
  private brokerOrderId: string
  // retry with price adjustments
  private readonly MAX_PRICE_ADJUSTMENT_ATTEMPTS: number = 3
  private readonly MAX_PRICE_ADJUSTMENT_TICK_MULTIPLE: number = 5
  private lastPrice: number
  private priceAdjustments: number = 0
  private lastPriceAdjustmentTimestamp: number
  // regularly handle this order
  private timer: NodeJS.Timeout
  private readonly RETRY_INTERVAL_MS: number = 15_000

  // quantity = pendingQuantity + cancelledQuantity + filledQuantity + rejectedQuantity
  private readonly quantity: number

  private filledQuantity: number = 0
  private cancelledQuantity: number = 0
  private rejectedQuantity: number = 0

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
    this.quantity = orderRequest.quantity
    this.logger.setContext(
      `${this.constructor.name} ${(Math.random() * 1000).toFixed(0)}`,
    )
  }

  public execute = async () => {
    this.logger.log(`executing order`)
    try {
      this.start()
      this.brokerOrderId = (
        await withRetry<Awaited<ReturnType<OrderHandler['placeOrder']>>>(
          this.placeOrder.bind(this),
        )
      ).brokerOrderId
    } catch (error) {
      this.logger.error(`failed`, error)
      this.stop()
      this.emitFailed()
    }
  }

  private start = () => {
    this.logger.log(`starting order handler timer`)
    this.timer = setTimeout(this.manageOrder, this.RETRY_INTERVAL_MS)
  }

  private stop = () => {
    this.logger.log(`stopping order handler timer`)
    clearTimeout(this.timer)
  }

  private manageOrder = async () => {
    this.logger.log(
      `${this.RETRY_INTERVAL_MS} ms passed since placing order, order not completed yet, managing.`,
    )
    clearTimeout(this.timer)

    // MODIFY ORDER PRICE
    if (this.priceAdjustments < this.MAX_PRICE_ADJUSTMENT_ATTEMPTS) {
      try {
        this.lastPrice = await withRetry<
          Awaited<ReturnType<OrderHandler['modifyOrder']>>
        >(this.modifyOrder.bind(this))
        this.priceAdjustments++
        this.lastPriceAdjustmentTimestamp = Date.now()
        this.timer = setTimeout(this.manageOrder, this.RETRY_INTERVAL_MS)
      } catch (error) {
        this.stop()
        this.emitNotHandled()
      }
    }

    // CANCEL ORDER
    else {
      try {
        await withRetry<Awaited<ReturnType<OrderHandler['cancelOrder']>>>(
          this.cancelOrder.bind(this),
        )
        this.stop()
        this.emitHandled()
      } catch (error) {
        this.stop()
        this.emitNotHandled()
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
  onOrderCompleteEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    this.filledQuantity = update.filledQuantity

    this.stop()
    this.emitHandled()
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderRejected)
  onOrderRejectedEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    this.rejectedQuantity =
      this.quantity - this.filledQuantity - this.cancelledQuantity

    this.stop()
    this.emitHandled()
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderCancelled)
  onOrderCancelledEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    this.cancelledQuantity = update.cancelledQuantity

    this.stop()
    this.emitHandled()
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderModifiedOrPartialComplete)
  onOrderModifiedOrPartialCompleteEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    this.filledQuantity = update.filledQuantity
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderUnknown)
  onOrderUnknownEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    doNothing()
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderOpen)
  onOrderOpenEvent(update: OrderUpdate) {
    if (!(update.brokerOrderId === this.brokerOrderId)) {
      return
    }

    doNothing()
  }

  emitFailed = async () => {
    const eventData = {
      brokerOrderId: this.brokerOrderId,
      filledQuantity: 0,
      averagePrice: 0,
      orderRequest: this.orderRequest,
    }

    this.logger.log(`failed to place order:`, eventData)

    this.eventEmitter.emit(OrderHandler.Events.OrderHandlerFailed, eventData)
  }

  emitHandled = async () => {
    const trades = await this.apiService.getOrderTrades({
      brokerOrderId: this.brokerOrderId,
    })

    const { averagePrice, filledQuantity } =
      this.calculateAveragePriceAndFilledQuantity(trades)

    const eventData = {
      brokerOrderId: this.brokerOrderId,
      filledQuantity,
      averagePrice,
      orderRequest: this.orderRequest,
    }

    this.logger.log(`handled order, status:`, eventData)

    this.eventEmitter.emit(OrderHandler.Events.OrderHandlerHandled, {
      brokerOrderId: this.brokerOrderId,
      filledQuantity,
      averagePrice,
      orderRequest: this.orderRequest,
    })
  }

  emitNotHandled = async () => {
    const trades = await this.apiService.getOrderTrades({
      brokerOrderId: this.brokerOrderId,
    })

    const { averagePrice, filledQuantity } =
      this.calculateAveragePriceAndFilledQuantity(trades)

    const eventData = {
      brokerOrderId: this.brokerOrderId,
      filledQuantity,
      averagePrice,
      orderRequest: this.orderRequest,
    }

    this.logger.log(`couldn't handle order, status:`, eventData)

    this.eventEmitter.emit(
      OrderHandler.Events.OrderHandlerNotHandled,
      eventData,
    )
  }

  private calculateAveragePriceAndFilledQuantity = (
    trades: Trade[],
  ): {
    averagePrice: number
    filledQuantity: number
  } => {
    if (trades.length === 0) {
      return {
        averagePrice: 0,
        filledQuantity: 0,
      }
    }

    if (trades.length === 1) {
      return {
        averagePrice: trades[0].averagePrice,
        filledQuantity: trades[0].quantity,
      }
    }

    const { totalQuantity, totalCost } = trades.reduce(
      (acc, trade) => {
        acc.totalQuantity += trade.quantity
        acc.totalCost += trade.quantity * trade.averagePrice
        return acc
      },
      { totalQuantity: 0, totalCost: 0 },
    )

    const averagePrice = parseFloat((totalCost / totalQuantity).toFixed(2))
    return {
      averagePrice,
      filledQuantity: totalQuantity,
    }
  }
}

export { OrderHandler }
