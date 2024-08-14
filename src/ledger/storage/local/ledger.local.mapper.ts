import { z } from 'zod'
import { Trade } from '../../ledger'

import { Trade as PrismaTrade } from '@prisma/client'
import { BuyOrSell } from 'src/types/app/entities'

export const LedgerMpper = {
  toDomain(trade: PrismaTrade): Trade {
    return {
      brokerOrderId: trade.brokerOrderId,
      tradingsymbol: trade.tradingsymbol,
      averagePrice: trade.averagePrice,
      quantity: trade.quantity,
      buyOrSell: z.nativeEnum(BuyOrSell).parse(trade.buyOrSell),
      tag: trade.tag,
    }
  },
  toPersistence(trade: Trade): Omit<PrismaTrade, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      brokerOrderId: trade.brokerOrderId,
      tradingsymbol: trade.tradingsymbol,
      averagePrice: trade.averagePrice,
      quantity: trade.quantity,
      buyOrSell: trade.buyOrSell,
      tag: trade.tag,
    }
  },
}
