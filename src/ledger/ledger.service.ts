import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Trade } from './ledger';
import { LEDGER_STORE_PORT, LedgerStorePort } from './ledger.store.port';
import { randomUUID } from 'crypto';
import { OrderUpdate } from 'src/live/live';
import { LiveService } from 'src/live/live.service';
import { AppLogger } from 'src/logger/logger.service';

@Injectable()
export class LedgersService {
  private trades: Trade[];

  constructor(
    @Inject(LEDGER_STORE_PORT)
    private readonly storage: LedgerStorePort,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(this.constructor.name)
  }

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
    return this.trades.filter(trade => trade.tag.startsWith(tag))
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


  /*
    brokerOrderId: string;
    status: OrderStatus;
    tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol;
    token: EquityToken | DerivativeToken;
    buyOrSell: BuyOrSell;
    quantity: number;
    pendingQuantity: number;
    filledQuantity: number;
    unfilledQuantity: number;
    cancelledQuantity: number;
    price: number;
    exchange: Exchange;
    // only in case of complete order
    averagePrice: number;
    tag: string;
  */
  @OnEvent(LiveService.Events.OrderUpdateOrderComplete)
  private onOrderCompleteEvent(update: OrderUpdate) {
    this.logger.log(`order complete`, update)
  }

  @OnEvent(LiveService.Events.OrderUpdateOrderModifiedOrPartialComplete)
  private onOrderModifiedOrPartialCompleteEvent(update: OrderUpdate) {
    this.logger.log(`order partial update`, update)
  }
}
