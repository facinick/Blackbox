import { Tick } from 'src/live/live'

interface QuotesApiPort {
  getStockLtp: (
    tradingsymbols: Array<string>,
  ) => Promise<Record<string, Tick>>
  getDerivativeLtp: (
    tradingsymbols: Array<string>,
  ) => Promise<Record<string, Tick>>
}

export { QuotesApiPort }
