import { KiteConnect } from 'kiteconnect'
import { Order, OrderHistory, Trade } from './order'
import { z } from 'zod'
import { BuyOrSell, Exchange } from 'src/types/app/entities'

export const OrdersMapper = {
  Orders: {
    toDomain: (
      zOrder: Awaited<ReturnType<KiteConnect['getOrders']>>[number],
    ): Order => {
      const brokerOrderId = zOrder.order_id

      const tradingsymbol = zOrder.tradingsymbol

      const token = zOrder.instrument_token

      const quantity = zOrder.quantity

      const price = zOrder.price

      const averagePrice = zOrder.average_price

      const buyOrSell = z.nativeEnum(BuyOrSell).parse(zOrder.transaction_type)

      const exchange = z.nativeEnum(Exchange).parse(zOrder.exchange)

      const tag = zOrder.tag

      return {
        brokerOrderId,
        tradingsymbol,
        token,
        quantity,
        price,
        averagePrice,
        buyOrSell,
        exchange,
        tag,
      }
    },
  },
  OrderHistory: {
    toDomain: (
      zOrder: Awaited<ReturnType<KiteConnect['getOrderHistory']>>[number],
    ): OrderHistory => {
      const brokerOrderId = zOrder.order_id

      const tradingsymbol = zOrder.tradingsymbol

      const token = zOrder.instrument_token

      const quantity = zOrder.quantity

      const pendingQuantity = zOrder.pending_quantity

      const status = zOrder.status

      const filledQuantity = zOrder.filled_quantity

      const cancelledQuantity = zOrder.cancelled_quantity

      const price = zOrder.price

      const averagePrice = zOrder.average_price

      const buyOrSell = zOrder.transaction_type as BuyOrSell

      const exchange = zOrder.exchange as Exchange

      const tag = zOrder.tag

      return {
        brokerOrderId,
        tradingsymbol,
        token,
        quantity,
        pendingQuantity,
        status,
        filledQuantity,
        cancelledQuantity,
        price,
        averagePrice,
        buyOrSell,
        exchange,
        tag,
      }
    },
  },
  Trade: {
    toDomain: (
      zTrade: Awaited<ReturnType<KiteConnect['getOrderTrades']>>[number],
    ): Trade => {
      const brokerOrderId = zTrade.order_id

      const brokerTradeId = zTrade.trade_id

      const averagePrice = zTrade.average_price

      const quantity = zTrade.filled

      return {
        brokerOrderId,
        brokerTradeId,
        averagePrice,
        quantity,
      }
    },
  },
}
