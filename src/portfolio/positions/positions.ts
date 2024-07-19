type Position = {
  tradingsymbol: Tradingsymbol
  token: DerivativeToken
  quantity: number
  averagePrice: number
  exchange: Exchange
  product: Product
}

type DerivativePosition = {
  name: DerivativeName
  tradingsymbol: DerivativeTradingsymbol
  token: DerivativeToken
  quantity: number
  averagePrice: number
  buyOrSell: BuyOrSell
  expiry: DerivativeExpiryParsed
  instrumentType: DerivativeInstrumentType
  strike: StrikePrice
}

export { type Position, type DerivativePosition }

// filter by:
// exchange = NFO | BFO
// product = NRML
// quantity != 0

// buyOrSell -> quantity < 0 -> "BUY", quantity > 0 -> "SELL"
// expiry -> find from Data Service
// name -> find from Data Service

// [
//   {
//     tradingsymbol: 'ITC',
//     exchange: 'BSE',
//     instrument_token: 128224004,
//     product: 'CNC',
//     quantity: -17,
//     overnight_quantity: 0,
//     multiplier: 1,
//     average_price: 461.55,
//     close_price: 0,
//     last_price: 459,
//     value: 7846.35,
//     pnl: 43.350000000000364,
//     m2m: 43.350000000000364,
//     unrealised: 43.350000000000364,
//     realised: 0,
//     buy_quantity: 0,
//     buy_price: 0,
//     buy_value: 0,
//     buy_m2m: 0,
//     sell_quantity: 17,
//     sell_price: 461.55,
//     sell_value: 7846.35,
//     sell_m2m: 7846.35,
//     day_buy_quantity: 0,
//     day_buy_price: 0,
//     day_buy_value: 0,
//     day_sell_quantity: 17,
//     day_sell_price: 461.55,
//     day_sell_value: 7846.35
//   },
//   {
//     tradingsymbol: 'ITC24JUL460CE',
//     exchange: 'NFO',
//     instrument_token: 30878210,
//     product: 'NRML',
//     quantity: -1600,
//     overnight_quantity: 0,
//     multiplier: 1,
//     average_price: 8.65,
//     close_price: 0,
//     last_price: 6.6,
//     value: 13840,
//     pnl: 3280,
//     m2m: 3280,
//     unrealised: 3280,
//     realised: 0,
//     buy_quantity: 0,
//     buy_price: 0,
//     buy_value: 0,
//     buy_m2m: 0,
//     sell_quantity: 1600,
//     sell_price: 8.65,
//     sell_value: 13840,
//     sell_m2m: 13840,
//     day_buy_quantity: 0,
//     day_buy_price: 0,
//     day_buy_value: 0,
//     day_sell_quantity: 1600,
//     day_sell_price: 8.65,
//     day_sell_value: 13840
//   },
//   {
//     tradingsymbol: 'TITAN24JUL3240CE',
//     exchange: 'NFO',
//     instrument_token: 37166082,
//     product: 'NRML',
//     quantity: -175,
//     overnight_quantity: -175,
//     multiplier: 1,
//     average_price: 64,
//     close_price: 68.2,
//     last_price: 49.3,
//     value: 11200,
//     pnl: 2572.5,
//     m2m: 3307.5,
//     unrealised: 2572.5,
//     realised: 0,
//     buy_quantity: 0,
//     buy_price: 0,
//     buy_value: 0,
//     buy_m2m: 0,
//     sell_quantity: 175,
//     sell_price: 64,
//     sell_value: 11200,
//     sell_m2m: 11935,
//     day_buy_quantity: 0,
//     day_buy_price: 0,
//     day_buy_value: 0,
//     day_sell_quantity: 0,
//     day_sell_price: 0,
//     day_sell_value: 0
//   },
//   {
//     tradingsymbol: 'ITC24JUL450CE',
//     exchange: 'NFO',
//     instrument_token: 30853378,
//     product: 'NRML',
//     quantity: 0,
//     overnight_quantity: -1600,
//     multiplier: 1,
//     average_price: 0,
//     close_price: 12.9,
//     last_price: 12.6,
//     value: -6880,
//     pnl: -6880,
//     m2m: -3200,
//     unrealised: -6880,
//     realised: 0,
//     buy_quantity: 1600,
//     buy_price: 14.9,
//     buy_value: 23840,
//     buy_m2m: 23840,
//     sell_quantity: 1600,
//     sell_price: 10.6,
//     sell_value: 16960,
//     sell_m2m: 20640,
//     day_buy_quantity: 1600,
//     day_buy_price: 14.9,
//     day_buy_value: 23840,
//     day_sell_quantity: 0,
//     day_sell_price: 0,
//     day_sell_value: 0
//   }
// ]
// proc
