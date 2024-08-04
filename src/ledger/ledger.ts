type Trade = {
  brokerOrderId: string
  tradingsymbol: Tradingsymbol
  averagePrice: number
  quantity: number
  buyOrSell: BuyOrSell
  tag: string
}

export { Trade }
