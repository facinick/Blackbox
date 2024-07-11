import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';
import { DataService } from 'src/data/data.service';

@Injectable()
export class PositionsService {
  private positions: Position[];

  constructor(
    private readonly apiService: ApiService,
    private readonly dataService: DataService,
  ) {}

  async initialize() {
    await this.syncPositions();
  }

  public async syncPositions() {
    const zPositions = await (await this.apiService.getPositions()).net;

    this.processPositions(zPositions);
  }

  private processPositions(
    zPositions: Awaited<ReturnType<ApiService['getPositions']>>['net'],
  ) {
    this.positions = zPositions.map(this.zPositionToDomain);
  }

  private zPositionToDomain(
    zPosition: Awaited<ReturnType<ApiService['getPositions']>>['net'][0],
  ): Position {
    const name: DerivativeName = DataService.parseDerivativeTradingSymbol(
      zPosition.tradingsymbol as DerivativeTradingsymbol,
    ).name;

    const tradingsymbol: DerivativeTradingsymbol =
      zPosition.tradingsymbol as DerivativeTradingsymbol;

    const token: DerivativeToken = zPosition.instrument_token;

    const expiry: DerivativeExpiry =
      this.dataService.getDerivativeExpiryInfoFromDerivativeToken(token);

    const quantity: number = zPosition.quantity;

    const averagePrice: number = zPosition.average_price;

    const buyOrSell: BuyOrSell = zPosition.quantity > 0 ? 'BUY' : 'SELL';

    return {
      name,
      tradingsymbol,
      expiry,
      token,
      quantity,
      averagePrice,
      buyOrSell,
    };
  }

  getPositions() {
    return this.positions;
  }
}
