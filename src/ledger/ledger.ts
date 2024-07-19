type Trade = {
  id: string
  tradingsymbol: Tradingsymbol
  token: Token
  averagePrice: number
  quantity: number
  instrumentType: InstrumentType
  segment: Segment
  exchange: Exchange
  buyOrSell: BuyOrSell
  tag: string
}

export { Trade }
