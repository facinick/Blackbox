import { Injectable } from '@nestjs/common';
import { ApiService } from 'src/api/api.service';

@Injectable()
export class HoldingsService {
  private holdings: Holding[];

  constructor(private readonly apiService: ApiService) {}

  async initialize() {
    await this.syncHoldings();
  }

  public async syncHoldings() {
    const zHoldings = await this.apiService.getHoldings();

    this.processHoldings(zHoldings);
  }

  private processHoldings(
    zHoldings: Awaited<ReturnType<ApiService['getHoldings']>>,
  ) {
    this.holdings = zHoldings.map(HoldingsService.zHoldingToDomain);
  }

  static zHoldingToDomain(
    zHolding: Awaited<ReturnType<ApiService['getHoldings']>>[0],
  ): Holding {
    const tradingsymbol: EquityTradingsymbol = zHolding.tradingsymbol;

    const token: EquityToken = zHolding.instrument_token;

    const quantity: number = zHolding.quantity;

    const averagePrice: number = zHolding.average_price;

    return {
      tradingsymbol,
      token,
      quantity,
      averagePrice,
    };
  }

  getHoldings() {
    return this.holdings;
  }
}
