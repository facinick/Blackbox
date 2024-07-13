import { Injectable } from '@nestjs/common';
import { OrderUpdate } from 'src/live/live.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Trade } from './ledger';
import { LedgerStorePort } from './ledger.store.port';
import { randomUUID } from 'crypto';

@Injectable()
export class LedgersService {
  private trades: Trade[];

  constructor(
    private readonly storage: LedgerStorePort
  ) {}

  async initialize() {
    await this.syncLedger();
  }

  public async syncLedger() {
    this.trades = await this.storage.getTrades()
  }

  public getTrades() {
    return this.trades;
  }

  public getTradesByTag(tag: string) {
    return this.trades.filter(trade => trade.tag === tag)
  }

  // mutation, after this make sure to load ledger again
  public async saveTrade(trade: Trade) {
    await this.storage.saveTrade(trade)
  }

  static create = (createTradeDto: Omit<Trade, 'id'>) => {
    return {
      ...createTradeDto,
      id: randomUUID()
    }
  }

  @OnEvent('order.completed')
  private onOrderCompletedEvent(update: OrderUpdate) {
    // this.addRecord({
    //     ...update,
    //     id: update.brokerOrderId,
    //     instrumentType: update.
    //     segment: 'NFO_OPT'
    // })
  }
}
