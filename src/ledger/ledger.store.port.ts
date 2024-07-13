import { Trade } from "./ledger"

interface LedgerStorePort {
    getTrades: () => Promise<Trade[]>
    saveTrade: (trade: Trade) => Promise<void>
    getTradesByTag: (tag: string) => Promise<Trade[]>
}

export {
    LedgerStorePort
}