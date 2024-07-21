import { DataService } from 'src/data/data.service'
import { Tick, OrderUpdate, OrderStatus } from './live'
import { ZOrderUpdate } from 'src/types/thirdparty/order-update'
import { ZTick } from 'src/types/thirdparty/tick'

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
      let segment: Segment
      let instrumentType: InstrumentType

      if (
        DataService.isCallOption(
          zOrderUpdate.tradingsymbol as DerivativeTradingsymbol,
        )
      ) {
        ;(segment = 'NFO-OPT'), (instrumentType = 'CE')
      } else if (
        DataService.isPutOption(
          zOrderUpdate.tradingsymbol as DerivativeTradingsymbol,
        )
      ) {
        ;(segment = 'NFO-OPT'), (instrumentType = 'PE')
      } else {
        ;(segment = 'NSE'), (instrumentType = 'EQ')
      }

      return {
        brokerOrderId: zOrderUpdate.order_id,
        status: zOrderUpdate.status as OrderStatus,
        tradingsymbol: zOrderUpdate.tradingsymbol,
        token: zOrderUpdate.instrument_token,
        buyOrSell: zOrderUpdate.transaction_type as BuyOrSell,
        quantity: zOrderUpdate.quantity,
        pendingQuantity: zOrderUpdate.pending_quantity,
        filledQuantity: zOrderUpdate.filled_quantity,
        cancelledQuantity: zOrderUpdate.cancelled_quantity,
        unfilledQuantity: zOrderUpdate.unfilled_quantity,
        price: zOrderUpdate.price,
        exchange: zOrderUpdate.exchange as Exchange,
        segment,
        instrumentType,
        // only in case of complete order
        averagePrice: zOrderUpdate.average_price,
        tag: zOrderUpdate.tag,
      }
    },
  },
}
