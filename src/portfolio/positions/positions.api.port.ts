import { Position } from "./Positions"

interface PositionsApiPort {
    getNetPositions: () => Promise<Position[]>
}

export {
    PositionsApiPort
}