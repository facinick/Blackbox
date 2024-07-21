import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LedgersService } from 'src/ledger/ledger.service'
import { AppLogger } from 'src/logger/logger.service'
import { OrderHandler, OrderHandlerEventData } from './order-handler.service'
import { AdjustByTick } from './price-adjustment/adjust-by-tick'
import { PriceAdjustmentStrategy } from './price-adjustment/price-adjustment.strategy'

type ExecuteOrderDto = {
  tradingsymbol: Tradingsymbol
  price: number
  buyOrSell: BuyOrSell
  quantity: number
  tag: string
}

type OrderRequest = {
  orderManagerOrderId: string
  tradingsymbol: Tradingsymbol
  price: number
  quantity: number
  buyOrSell: BuyOrSell
  tag: string
}

@Injectable()
class OrderManagerService {
  private lock: boolean = false
  private readonly orderBasket: Set<OrderRequest> = new Set()
  private readonly orderHandlers: Map<string, OrderHandler> = new Map()

  constructor(
    private readonly ledgerService: LedgersService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: AppLogger,
    @Inject('OrderHandlerFactory')
    private readonly orderHandlerFactory: (
      orderRequest: OrderRequest,
    ) => OrderHandler,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  async execute(orderDtos: Array<ExecuteOrderDto>) {
    if (this.lock) {
      return
    }

    this.logger.log(
      `================ Order Manager Execution Started ================`,
    )
    this.lock = true
    this.initialize(orderDtos)
    this.logger.log(`starting execution of ${this.orderBasket.size} order(s)`)

    const promises = await Promise.allSettled<OrderHandlerEventData>(
      Array.from(this.orderBasket).map((orderRequest) => {
        return new Promise((resolve, reject) => {
          try {
            const handler = this.orderHandlerFactory(orderRequest)
            this.orderHandlers.set(orderRequest.orderManagerOrderId, handler)
            // these orders were not placed
            this.eventEmitter.on(
              OrderHandler.Events.OrderHandlerFailed,
              (eventData) => reject(eventData),
            )
            // these orders were placed and either complete / cancelled / rejected
            this.eventEmitter.on(
              OrderHandler.Events.OrderHandlerHandled,
              (eventData) => resolve(eventData),
            )
            // these orders were placed and needs manual intervention
            this.eventEmitter.on(
              OrderHandler.Events.OrderHandlerNotHandled,
              (eventData) => resolve(eventData),
            )
            handler.execute()
          } catch (error) {
            this.logger.error('failed to create order handler', error)
            reject(error)
          }
        })
      }),
    )

    this.logger.log(`finished execution of ${this.orderBasket.size} order(s)`)

    this.logger.log(`saving trades to ledger`)

    for (const promise of promises) {
      if (promise.status === 'fulfilled') {
        await this.updateLedger(promise.value)
      }
    }

    this.lock = false
    this.reset()
    this.logger.log(
      `================ Order Manager Execution Finished ================`,
    )
  }

  private reset = () => {
    this.orderBasket.clear()
    this.orderHandlers.clear()
  }

  private initialize = (orderDtos: Array<ExecuteOrderDto>) => {
    orderDtos.forEach((orderDto, index) => {
      this.orderBasket.add({
        ...orderDto,
        orderManagerOrderId: String(index),
      })
    })
  }

  private updateLedger = async ({
    orderRequest,
    brokerOrderId,
    averagePrice,
    filledQuantity,
  }: {
    orderRequest: OrderRequest
    brokerOrderId: string
    averagePrice: number
    filledQuantity: number
  }) => {
    if (filledQuantity !== 0 && brokerOrderId !== null) {
      await this.ledgerService.saveTrade({
        id: brokerOrderId,
        tradingsymbol: orderRequest.tradingsymbol,
        averagePrice,
        quantity: filledQuantity,
        buyOrSell: orderRequest.buyOrSell,
        tag: orderRequest.tag,
      })
    }
  }
}

export {
  AdjustByTick, ExecuteOrderDto, OrderHandler, OrderManagerService, OrderRequest,
  type PriceAdjustmentStrategy
}
