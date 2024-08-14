import { BuyOrSell, Exchange } from "src/types/app/entities"

export type OrderStatus =
  | 'COMPLETE'
  | 'REJECTED'
  | 'CANCELLED'
  | 'UPDATE'
  | 'OPEN'

export type OrderUpdate = {
  brokerOrderId: string
  status: OrderStatus
  tradingsymbol: string
  token: number
  buyOrSell: BuyOrSell
  quantity: number
  pendingQuantity: number
  filledQuantity: number
  unfilledQuantity: number
  cancelledQuantity: number
  price: number
  exchange: Exchange
  // only in case of complete order
  averagePrice: number
  tag: string
}

export interface Tick {
  token: number
  price: number
}
