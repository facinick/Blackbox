import { Injectable } from '@nestjs/common'
import { Trade } from '../../ledger'
import { LedgerStorePort } from '../../ledger.store.port'
import { PrismaService } from 'src/prisma/prisma.service'
import { LedgerMpper } from './ledger.local.mapper'

@Injectable()
export class LedgerLocalStore implements LedgerStorePort {
  constructor(private readonly db: PrismaService) {}

  getTrades = async () => {
    const trades = await this.db.trade.findMany()
    return trades.map(LedgerMpper.toDomain)
  }

  saveTrade = async (trade: Trade) => {
    await this.db.trade.create({
      data: {
        ...trade,
      },
    })
  }

  getTradesByTag = async (tag: string) => {
    const trades = await this.db.trade.findMany({
      where: {
        tag,
      },
    })
    return trades.map(LedgerMpper.toDomain)
  }
}
