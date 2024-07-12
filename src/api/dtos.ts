// import { KiteConnect } from 'kiteconnect'

// type OrdersZerodhaEntity = Awaited<ReturnType<KiteConnect['getOrders']>>

// type OrdersZerodhaEntity = Awaited<ReturnType<KiteConnect['placeOrder']>>

// type OrderBroker = Pick<OrdersZerodhaEntity[number], 'average_price' | 'exchange' | '' >

// const ApiMapper = {
//     order: {
//         placeOrder: (order: Order): KiteConnect['placeOrder'] => {
//             return {
//                 exchange: order.instrumentType === 'EQ' ? KiteConnect['EXCHANGE_NSE'] : KiteConnect['EXCHANGE_NFO'],
//                 tradingsymbol: order.tradingsymbol,
//                 transaction_type: order.buyOrSell,
//                 quantity: order.quantity,
//                 product: order.instrumentType === 'EQ' ? KiteConnect['PRODUCT_CNC'] : KiteConnect['PRODUCT_NRML'],
//                 order_type: KiteConnect['ORDER_TYPE_LIMIT'],
//             }
//         },
//         fromApi: (orderBroker: OrderBroker): Order => {

//         }
//     }
// }
