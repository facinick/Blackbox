import { KiteConnect } from 'kiteconnect'
import { Holding } from './holdings'

export const HoldingsMapper = {
  toDomain: (
    zHolding: Awaited<ReturnType<KiteConnect['getHoldings']>>[number],
  ): Holding => {
    const tradingsymbol: EquityTradingsymbol = zHolding.tradingsymbol

    const token: EquityToken = zHolding.instrument_token

    const quantity: number =
      zHolding.authorised_quantity - zHolding.used_quantity + zHolding.quantity

    const averagePrice: number = zHolding.average_price

    return {
      tradingsymbol,
      token,
      quantity,
      averagePrice,
    }
  },
}
