import {
  CancelOrder,
  ModifyOrderPrice,
  Order,
  OrderHistory,
  PlaceOrder,
  GetOrderHistory,
  GetOrderTrades,
} from './order'

interface OrderApiPort {
  placeOrder: (
    placeOrderDto: PlaceOrder['Request'],
  ) => Promise<PlaceOrder['Response']>
  modifyOrderPrice: (
    modifyPriceDto: ModifyOrderPrice['Request'],
  ) => Promise<ModifyOrderPrice['Response']>
  cancelOrder: (
    cancelOrderDto: CancelOrder['Request'],
  ) => Promise<CancelOrder['Response']>
  getTodaysOrders: () => Promise<Order[]>
  getOrderHistory: (
    getOrderHistoryDto: GetOrderHistory['Request'],
  ) => Promise<GetOrderHistory['Response']>
  getOrderTrades: (
    getOrderTradesDto: GetOrderTrades['Request'],
  ) => Promise<GetOrderTrades['Response']>
}

export { OrderApiPort }
