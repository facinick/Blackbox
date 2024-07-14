import { DataService } from "src/data/data.service";
import { DerivativePosition, Position } from "./Positions";

export const openDerivativePositionsFilter = (position: Position): boolean => {
    return (
      (position.quantity !== 0 &&
      DataService.hasDerivativeInfo(position.tradingsymbol as DerivativeTradingsymbol)
      )
    );
  };

export const callPositionsFilter = (position: DerivativePosition): boolean => {
  return (position.instrumentType === 'CE');
};

export const putPositionsFilter = (position: DerivativePosition): boolean => {
  return (position.instrumentType === 'PE');
};