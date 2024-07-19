import { Tick } from 'src/live/live'

interface QuotesApiPort {
  getStockLtp: (
    tradingsymbols: Array<EquityTradingsymbol>,
  ) => Promise<Record<EquityTradingsymbol, Tick>>
  getDerivativeLtp: (
    tradingsymbols: Array<DerivativeTradingsymbol>,
  ) => Promise<Record<DerivativeTradingsymbol, Tick>>
}

export { QuotesApiPort }
