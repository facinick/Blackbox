import { EventEmitter2 } from '@nestjs/event-emitter'
import { Inject, Injectable } from '@nestjs/common'
import { OrderHandler } from './order-handler.service'
import { AdjustByTick } from './price-adjustment/adjust-by-tick'
import { PriceAdjustmentStrategy } from './price-adjustment/price-adjustment.strategy'
import { AppLogger } from 'src/logger/logger.service'

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
    
    this.logger.log(`================ Order Manager Execution Started ================`)
    this.lock = true
    this.initialize(orderDtos)
    this.logger.log(`starting execution of ${this.orderBasket.size} orders`)

    await Promise.allSettled(
      Array.from(this.orderBasket).map((orderRequest) => {
        return new Promise((resolve, reject) => {
          try {
            const handler = this.orderHandlerFactory(orderRequest)
            this.orderHandlers.set(orderRequest.orderManagerOrderId, handler)
            this.eventEmitter.on('order-handler.unknown', resolve)
            this.eventEmitter.on('order-handler.done', resolve)
            handler.execute()
          } catch (error) {
            this.logger.error('failed to create order handler', error)
            reject(error)
          }
        })
      }),
    )

    this.logger.log(`finished execution of ${this.orderBasket.size} orders`)
    this.lock = false
    this.reset()
    this.logger.log(`================ Order Manager Execution Finished ================`)
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
}

export {
  OrderManagerService,
  ExecuteOrderDto,
  AdjustByTick,
  OrderRequest,
  type PriceAdjustmentStrategy,
  OrderHandler,
}
