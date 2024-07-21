import { Inject, Injectable } from '@nestjs/common'
import { AppLogger } from 'src/logger/logger.service'
import { Trade } from './ledger'
import { LEDGER_STORE_PORT, LedgerStorePort } from './ledger.store.port'

@Injectable()
export class LedgersService {
  private trades: Trade[]

  constructor(
    @Inject(LEDGER_STORE_PORT)
    private readonly storage: LedgerStorePort,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  async initialize() {
    await this.syncLedger()
  }

  public async syncLedger() {
    this.trades = await this.storage.getTrades()
  }

  public getTrades() {
    return this.trades
  }

  public getTradesByTag(tag: string) {
    return this.trades.filter((trade) => trade.tag.startsWith(tag))
  }

  // mutation, after this make sure to load ledger again
  public async saveTrade(trade: Trade) {
    await this.storage.saveTrade(trade)
  }
}
