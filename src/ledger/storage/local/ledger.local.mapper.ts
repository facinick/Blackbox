import { Trade } from '../../ledger'

import { Trade as PrismaTrade } from '@prisma/client'

export const LedgerMpper = {
  toDomain(trade: PrismaTrade): Trade {
    return {
      id: trade.id,
      tradingsymbol: trade.tradingsymbol as Tradingsymbol,
      token: trade.token,
      averagePrice: trade.averagePrice,
      quantity: trade.quantity,
      instrumentType: trade.instrumentType as InstrumentType,
      segment: trade.segment as Segment,
      exchange: trade.exchange as Exchange,
      buyOrSell: trade.buyOrSell as BuyOrSell,
      tag: trade.tag,
    }
  },
  toPersistence(trade: Trade): PrismaTrade {
    return {
      id: trade.id,
      tradingsymbol: trade.tradingsymbol as Tradingsymbol,
      token: trade.token,
      averagePrice: trade.averagePrice,
      quantity: trade.quantity,
      instrumentType: trade.instrumentType as InstrumentType,
      segment: trade.segment as Segment,
      exchange: trade.exchange as Exchange,
      buyOrSell: trade.buyOrSell as BuyOrSell,
      tag: trade.tag,
    }
  },
}
