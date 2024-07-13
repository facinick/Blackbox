import { OrderUpdate, Tick } from "./live"

interface LiveApiPort {
    registerForPriceUpdates: (func: (ticks: Tick[]) => void) => void
    registerForOrderUpdates: (func: (orderUpdate: OrderUpdate) => void) => void
    isConnected: () => void
    disconnectTicker: () => void
    connectTicker: () => void
    subscribeTicker: (tokens: Array<DerivativeToken | EquityToken>) => void
    unsubscribeTicker: (tokens: Array<DerivativeToken | EquityToken>) => void
    registerForConnect: (func: () => void) => void
    registerForDisconnect: (func: (error: any) => void) => void
    registerForError: (func: (error: any) => void) => void
    registerForClose: (func: () => void) => void
    registerForReconnect: (func: () => void) => void
    registerForNoreconnect: (func: () => void) => void
}

export {
    LiveApiPort
}