import { OrderRequest } from '../order-manager.service'

interface PriceAdjustmentStrategy {
  getNextPrice: (
    orderRequest: OrderRequest,
    lastPrice: number,
  ) => Promise<number>
}

const PRICE_ADJUSTMENT_STRATEGY = Symbol('PriceAdjustmentStrategy')

export { PriceAdjustmentStrategy, PRICE_ADJUSTMENT_STRATEGY }
