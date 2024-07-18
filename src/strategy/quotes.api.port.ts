import { Tick } from 'src/live/live';

interface QuotesApiPort {
  getStockLtp: (
    tradingSymbols: Array<EquityTradingsymbol>,
  ) => Promise<Record<EquityTradingsymbol, Tick>>;
  getDerivativeLtp: (
    tradingSymbols: Array<DerivativeTradingsymbol>,
  ) => Promise<Record<DerivativeTradingsymbol, Tick>>;
}

export { QuotesApiPort };
