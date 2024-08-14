import { Tick, OrderUpdate, OrderStatus } from './live'
import { ZOrderUpdate } from 'src/types/thirdparty/order-update'
import { ZTick } from 'src/types/thirdparty/tick'
import { BuyOrSell, Exchange } from 'src/types/app/entities'
import { z } from 'zod'

export const LiveMapper = {
  Tick: {
    toDomain: (tick: ZTick): Tick => {
      return {
        token: tick.instrument_token,
        price: tick.last_price,
      }
    },
  },

  OrderUpdate: {
    toDomain: (zOrderUpdate: ZOrderUpdate): OrderUpdate => {
      return {
        brokerOrderId: zOrderUpdate.order_id,
        status: zOrderUpdate.status as OrderStatus,
        tradingsymbol: zOrderUpdate.tradingsymbol,
        token: zOrderUpdate.instrument_token,
        buyOrSell:  z.nativeEnum(BuyOrSell).parse(zOrderUpdate.transaction_type),
        quantity: zOrderUpdate.quantity,
        pendingQuantity: zOrderUpdate.pending_quantity,
        filledQuantity: zOrderUpdate.filled_quantity,
        cancelledQuantity: zOrderUpdate.cancelled_quantity,
        unfilledQuantity: zOrderUpdate.unfilled_quantity,
        price: zOrderUpdate.price,
        exchange: z.nativeEnum(Exchange).parse(zOrderUpdate.exchange),
        // only in case of complete order
        averagePrice: zOrderUpdate.average_price,
        tag: zOrderUpdate.tag,
      }
    },
  },
}
