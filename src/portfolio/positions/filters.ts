import { DerivativePosition, Position } from "./Positions";

export const openDerivativePositionsFilter = (position: Position): boolean => {
    return (
      (position.exchange === 'BFO' || position.exchange === 'NFO') &&
      position.product === 'NRML' &&
      position.quantity !== 0
    );
  };

export const callPositionsFilter = (position: DerivativePosition): boolean => {
  return (position.instrumentType === 'CE');
};

export const putPositionsFilter = (position: DerivativePosition): boolean => {
  return (position.instrumentType === 'PE');
};