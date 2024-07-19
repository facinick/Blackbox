import { Trade } from './ledger'

interface LedgerStorePort {
  getTrades: () => Promise<Trade[]>
  saveTrade: (trade: Trade) => Promise<void>
  getTradesByTag: (tag: string) => Promise<Trade[]>
}

const LEDGER_STORE_PORT = Symbol('LedgerStorePort')

export { LedgerStorePort, LEDGER_STORE_PORT }
