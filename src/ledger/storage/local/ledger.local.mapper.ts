import { Trade } from '../../ledger'

import { Trade as PrismaTrade } from '@prisma/client'

export const LedgerMpper = {
  toDomain(trade: PrismaTrade): Trade {
    return {
      id: trade.id,
      tradingsymbol: trade.tradingsymbol as Tradingsymbol,
      averagePrice: trade.averagePrice,
      quantity: trade.quantity,
      buyOrSell: trade.buyOrSell as BuyOrSell,
      tag: trade.tag,
    }
  },
  toPersistence(trade: Trade): Omit<PrismaTrade, 'createdAt' | 'updatedAt'> {
    return {
      id: trade.id,
      tradingsymbol: trade.tradingsymbol as Tradingsymbol,
      averagePrice: trade.averagePrice,
      quantity: trade.quantity,
      buyOrSell: trade.buyOrSell as BuyOrSell,
      tag: trade.tag,
    }
  },
}
