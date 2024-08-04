import { KiteConnect } from 'kiteconnect'
import { Holding } from './holdings'

export const HoldingsMapper = {
  toDomain: (
    zHolding: Awaited<ReturnType<KiteConnect['getHoldings']>>[number],
  ): Holding => {
    const tradingsymbol: EquityTradingsymbol = zHolding.tradingsymbol

    const token: EquityToken = zHolding.instrument_token

    // Calculate the number of stocks available for sale
    const totalQuantity = zHolding.opening_quantity

    const usedQuantity = zHolding.used_quantity

    const collateralQuantity = zHolding.collateral_quantity
    const authorizedQuantity = zHolding.authorised_quantity
    
    const sellableQuantity = totalQuantity - usedQuantity

    const quantity: number = sellableQuantity

    const averagePrice: number = zHolding.average_price

    return {
      tradingsymbol,
      token,
      quantity,
      averagePrice,
    }
  },
}
