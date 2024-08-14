import { Position } from './Positions'

interface PositionsApiPort {
  getNetPositions: () => Promise<Position[]>
  getPositions: () => Promise<{
    net: Position[],
    day: Position[],
  }>
}

export { PositionsApiPort }
