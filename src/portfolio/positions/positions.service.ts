import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { DataService } from 'src/data/data.service';
import { DerivativePosition, Position } from './positions';
import { openDerivativePositionsFilter } from './filters';
import { AppLogger } from 'src/logger/logger.service';

@Injectable()
export class PositionsService {
  private positions: Position[];

  constructor(
    private readonly apiService: ApiService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    this.logger.log(`inintializing positions service`)
    await this.syncPositions();
  }

  public syncPositions = async () => {
    this.positions = await this.apiService.getNetPositions()
    this.logger.log(`positions updated:`,this.positions)
    this.logger.log(`open derivative positions:`,this.getOpenDerivativePositions())
  }

  getPositions = () => {
    return this.positions;
  }

  getOpenDerivativePositions = (): DerivativePosition[] => {
    const positions =  this.positions.filter(openDerivativePositionsFilter)
    const derivativePositions = positions.map(this.positionToDerivativePosition)
    return derivativePositions
  }

  private positionToDerivativePosition = (
    position:Position,
  ): DerivativePosition => {
    const derivativeInfo = DataService.getDerivativeInfoFromToken(position.token)
    const name: DerivativeName = derivativeInfo.tradingsymbolParsed.name
    const tradingsymbol: DerivativeTradingsymbol = derivativeInfo.tradingsymbol
    const instrumentType: DerivativeInstrumentType = derivativeInfo.tradingsymbolParsed.instrumentType;
    const token: DerivativeToken = position.token;
    const expiry: DerivativeExpiryParsed = derivativeInfo.expiryParsed 
    const strike: StrikePrice = derivativeInfo.strike 
    const quantity: number = position.quantity;
    const averagePrice: number = position.averagePrice;
    if(position.quantity === 0) {
      throw new Error(`open derivative position has quantity 0`)
    }
    const buyOrSell: BuyOrSell = position.quantity > 0 ? 'BUY' : 'SELL';

    return {
      name,
      tradingsymbol,
      expiry,
      token,
      quantity,
      averagePrice,
      buyOrSell,
      instrumentType,
      strike
    };
  }
}
