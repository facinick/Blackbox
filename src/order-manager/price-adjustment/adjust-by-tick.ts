import { Injectable } from '@nestjs/common';
import { DataService } from 'src/data/data.service';
import {
  PriceAdjustmentStrategy,
  OrderRequest,
} from '../order-manager.service';

@Injectable()
class AdjustByTick implements PriceAdjustmentStrategy {
  async getNextPrice(
    orderRequest: OrderRequest,
    lastPrice: number,
  ): Promise<number> {
    const tickSize = DataService.getTickSizeForTradingsymbol(
      orderRequest.tradingsymbol,
    );

    const nextPrice =
      orderRequest.buyOrSell === 'BUY'
        ? lastPrice + tickSize
        : lastPrice - tickSize;

    return nextPrice;
  }
}

export { AdjustByTick };
