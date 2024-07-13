import { Holding } from "./holdings"

interface HoldingsApiPort {
    getHoldings: () => Promise<Holding[]>
}

export {
    HoldingsApiPort
}