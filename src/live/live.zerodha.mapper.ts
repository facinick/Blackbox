import { DataService } from 'src/data/data.service'
import { Tick, OrderUpdate, OrderStatus } from './live'

export type ZOrderUpdate = {
  user_id: string
  unfilled_quantity: number
  app_id: number
  checksum: string
  placed_by: string
  order_id: string
  exchange_order_id: string | null
  parent_order_id: string | null
  status: string | null
  status_message: string | null
  status_message_raw: string | null
  order_timestamp: string
  exchange_update_timestamp: string
  exchange_timestamp: string
  variety: string
  exchange: string
  tradingsymbol: string
  instrument_token: number
  order_type: string
  transaction_type: string
  validity: string
  product: string
  quantity: number
  disclosed_quantity: number
  price: number
  trigger_price: number
  average_price: number
  filled_quantity: number
  pending_quantity: number
  cancelled_quantity: number
  market_protection: number
  meta: { [key: string]: any }
  tag: string | null
  guid: string
}

export interface ZTick {
  instrument_token: number
  last_price: number
}

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
