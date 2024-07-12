import { Injectable } from '@nestjs/common';
import { Ledger as PLedger, PrismaClient } from '@prisma/client';
import { OrderUpdate } from 'src/live/live.service';
import { Ledger } from './ledger';
import { OrderId, OrderTag } from 'src/order-manager/types';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LedgersService {
  private ledger: Ledger[];

  constructor(private readonly db: PrismaService) {}

  async initialize() {
    await this.syncLedger();
  }

  public async syncLedger() {
    const dbLedger = await this.db.ledger.findMany();

    this.processLedger(dbLedger);
  }

  private processLedger(dbLedger: PLedger[]) {
    this.ledger = dbLedger.map(LedgersService.pLedgerToDomain);
  }

  static pLedgerToDomain(pLedger: PLedger): Ledger {
    const id: OrderId = pLedger.id;

    const tradingsymbol: Tradingsymbol = pLedger.tradingsymbol;

    const token: Token = pLedger.token;

    const averagePrice: number = pLedger.averagePrice;

    const quantity: number = pLedger.quantity;

    const instrumentType: InstrumentType =
      pLedger.instrumentType as InstrumentType;

    const buyOrSell: BuyOrSell = pLedger.buyOrSell as BuyOrSell;

    const tag: OrderTag = pLedger.tag;

    const segment: Segment = pLedger.segment as Segment;

    const exchange: Exchange = pLedger.exchange as Exchange;

    return {
      id,
      tradingsymbol,
      token,
      averagePrice,
      quantity,
      instrumentType,
      segment,
      exchange,
      buyOrSell,
      tag,
    };
  }

  public getLedger() {
    return this.ledger;
  }

  public getRecordByTag(tag: string) {
    return this.ledger.filter((order) => order.tag === tag);
  }

  // mutation, after this make sure to load ledger again
  public async addRecord(ledger: Ledger) {
    const record: PLedger = {
      id: ledger.id,
      tradingsymbol: ledger.tradingsymbol,
      token: ledger.token,
      averagePrice: ledger.averagePrice,
      quantity: ledger.quantity,
      instrumentType: ledger.instrumentType,
      buyOrSell: ledger.buyOrSell,
      segment: ledger.segment,
      exchange: ledger.exchange,
      tag: ledger.tag,
    };

    await this.db.ledger.create({
      data: {
        ...record,
      },
    });
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
