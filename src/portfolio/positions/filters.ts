import { Position } from './Positions'

export const openPositionFilter = (position: Position): boolean => {
  return position.quantity !== 0
}