import { KiteConnect } from 'kiteconnect'
import { Position } from './Positions'
import { Exchange, Product } from 'src/types/app/entities'
import { z } from 'zod'

export const PositionsMapper = {
  toDomain: (
    zPosition: Awaited<ReturnType<KiteConnect['getPositions']>>['net'][number],
  ): Position => {
    const tradingsymbol = zPosition.tradingsymbol
    const averagePrice = zPosition.average_price
    const quantity = zPosition.quantity
    const token = zPosition.instrument_token
    const lastPrice = zPosition.last_price
    const exchange = z.nativeEnum(Exchange).parse(zPosition.exchange)
    const product = z.nativeEnum(Product).parse(zPosition.product)

    return {
      tradingsymbol,
      averagePrice,
      quantity,
      token,
      exchange,
      product,
      lastPrice
    }
  },
}
