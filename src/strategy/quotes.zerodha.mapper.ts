import { KiteConnect } from 'kiteconnect'
import { Tick } from 'src/live/live'

export const QuotesMapper = {
  toDomain: (
    zQuote: Awaited<ReturnType<KiteConnect['getLTP']>>,
  ): Record<string, Tick> => {
    const domainQuotes: Record<string, { price: number; token: number }> = {}

    for (const [symbol, data] of Object.entries(zQuote)) {
      const tradingSymbol = symbol.split(':')[1]

      domainQuotes[tradingSymbol] = {
        price: data.last_price,
        token: data.instrument_token,
      }
    }

    return domainQuotes
  },
}
