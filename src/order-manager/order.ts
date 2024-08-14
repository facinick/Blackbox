import { BuyOrSell, Exchange } from "src/types/app/entities"

type Order = {
  brokerOrderId: string
  tradingsymbol: string
  token: number
  quantity: number
  price: number
  averagePrice: number
  buyOrSell: BuyOrSell
  exchange: Exchange
  tag: string
}

type Trade = {
  brokerOrderId: string
  brokerTradeId: string
  quantity: number
  averagePrice: number
}

type GetOrderTrades = {
  Request: {
    brokerOrderId: string
  }
  Response: Trade[]
}

type OrderHistory = {
  brokerOrderId: string
  tradingsymbol: string
  token: number
  quantity: number
  cancelledQuantity: number
  filledQuantity: number
  pendingQuantity: number
  status: string
  price: number
  averagePrice: number
  buyOrSell: BuyOrSell
  exchange: Exchange
  tag: string
}

type GetOrderHistory = {
  Request: {
    brokerOrderId: string
  }
  Response: OrderHistory[]
}

type PlaceOrder = {
  Request: {
    tradingsymbol: string
    buyOrSell: BuyOrSell
    quantity: number
    price: number
    tag: string
  }
  Response: {
    brokerOrderId: string
  }
}

type ModifyOrderPrice = {
  Request: {
    orderId: string
    price: number
  }
  Response: {
    brokerOrderId: string
  }
}

type CancelOrder = {
  Request: {
    orderId: string
  }
  Response: {
    brokerOrderId: string
  }
}

export {
  Order,
  PlaceOrder,
  ModifyOrderPrice,
  CancelOrder,
  OrderHistory,
  GetOrderHistory,
  Trade,
  GetOrderTrades,
}
