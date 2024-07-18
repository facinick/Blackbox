import { Order } from './order';

interface OrderApiPort {
  placeOrder: (placeOrderDto: {
    tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol;
    buyOrSell: BuyOrSell;
    quantity: number;
  }) => Promise<string>;
  modifyOrderPrice: (modifyPriceDto: {
    orderId: string;
    price: number;
  }) => Promise<string>;
  cancelOrder: (cancelOrderDto: { orderId: string }) => Promise<string>;
  getOrders: () => Promise<Order[]>;
}

export { OrderApiPort };
