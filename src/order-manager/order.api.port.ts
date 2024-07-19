import { CancelOrder, ModifyOrderPrice, Order, PlaceOrder } from './order'

interface OrderApiPort {
  placeOrder: (placeOrderDto: PlaceOrder['Request']) => Promise<PlaceOrder['Response']>
  modifyOrderPrice: (modifyPriceDto:  ModifyOrderPrice['Request']) => Promise<ModifyOrderPrice['Response']>
  cancelOrder: (cancelOrderDto: CancelOrder['Request']) => Promise<CancelOrder['Response']>
  getOrders: () => Promise<Order[]>
}

export { OrderApiPort }
