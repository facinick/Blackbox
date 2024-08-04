import { Injectable } from '@nestjs/common'
import { Trade } from '../../ledger'
import { LedgerStorePort } from '../../ledger.store.port'
import { PrismaService } from 'src/prisma/prisma.service'
import { LedgerMpper } from './ledger.local.mapper'
import { AppLogger } from 'src/logger/logger.service'

@Injectable()
export class LedgerLocalStore implements LedgerStorePort {
  constructor(
    private readonly db: PrismaService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(this.constructor.name)
  }

  //todo: what to do with error?
  getTrades = async () => {
    try {
      const trades = await this.db.trade.findMany()
      return trades.map(LedgerMpper.toDomain)
    } catch (error) {
      this.logger.error('Error getting trades', error)
      throw error
    }
  }

  saveTrade = async (trade: Trade) => {
    try {
      await this.db.trade.create({
        data: {
          ...trade,
        },
      })
    } catch (error) {
      this.logger.error('Error saving trade', error)
      throw error
    }
  }

  getTradesByTag = async (tag: string) => {
    try {
      const trades = await this.db.trade.findMany({
        where: {
          tag,
        },
      })
      return trades.map(LedgerMpper.toDomain)
    } catch (error) {
      this.logger.error('Error getting trade', error)
      throw error
    }
  }
}
