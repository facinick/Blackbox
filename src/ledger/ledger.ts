import { BuyOrSell } from "src/types/app/entities"

type Trade = {
  brokerOrderId: string
  tradingsymbol: string
  averagePrice: number
  quantity: number
  buyOrSell: BuyOrSell
  tag: string
}

export { Trade }
