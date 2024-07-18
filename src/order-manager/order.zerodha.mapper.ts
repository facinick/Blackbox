import { KiteConnect } from 'kiteconnect';
import { Order } from './order';

export const OrdersMapper = {
  toDomain: (
    zOrder: Awaited<ReturnType<KiteConnect['getOrders']>>[number],
  ): Order => {
    const brokerOrderId = zOrder.order_id;

    const tradingsymbol = zOrder.tradingsymbol;

    const token = zOrder.instrument_token;

    const quantity = zOrder.quantity;

    const price = zOrder.price;

    const averagePrice = zOrder.average_price;

    const buyOrSell = zOrder.transaction_type as BuyOrSell;

    const exchange = zOrder.exchange as Exchange;

    const tag = zOrder.tag;

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
    };
  },
};
