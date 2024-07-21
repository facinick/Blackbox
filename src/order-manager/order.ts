type Order = {
  brokerOrderId: string
  tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol
  token: EquityToken | DerivativeToken
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
  tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol
  token: EquityToken | DerivativeToken
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
    tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol
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
