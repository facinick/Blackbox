import { Injectable } from '@nestjs/common';
import { KiteTicker } from 'kiteconnect';
import { Instrument } from 'src/data/data';
import { DataApiPort } from 'src/data/data.api.port';
import { Tick, OrderUpdate } from 'src/live/live';
import { LiveApiPort } from 'src/live/live.api.port';
import { AppLogger } from 'src/logger/logger.service';
import { Order } from 'src/order-manager/order';
import { OrderApiPort } from 'src/order-manager/order.api.port';
import { Balance } from 'src/portfolio/balances/Balances';
import { BalancesApiPort } from 'src/portfolio/balances/balances.api.port';
import { Holding } from 'src/portfolio/holdings/holdings';
import { HoldingsApiPort } from 'src/portfolio/holdings/holdings.api.port';
import { Position } from 'src/portfolio/positions/Positions';
import { PositionsApiPort } from 'src/portfolio/positions/positions.api.port';

@Injectable()
export class MockApiService implements
  HoldingsApiPort,
  BalancesApiPort,
  PositionsApiPort,
  OrderApiPort,
  DataApiPort,
  LiveApiPort {

  constructor(
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(this.constructor.name)
  }
  getHoldings: () => Promise<Holding[]>;
  getBalance: () => Promise<Balance>;
  getNetPositions: () => Promise<Position[]>;
  placeOrder: (placeOrderDto: { tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol; buyOrSell: BuyOrSell; quantity: number; }) => Promise<string>;
  modifyOrderPrice: (modifyPriceDto: { orderId: string; price: number; }) => Promise<string>;
  cancelOrder: (cancelOrderDto: { orderId: string; }) => Promise<string>;
  getOrders: () => Promise<Order[]>;
  getTradableEquities: () => Promise<Instrument[]>;
  getTradableDerivatives: () => Promise<Instrument[]>;
  registerForPriceUpdates: (func: (ticks: Tick[]) => void) => void;
  registerForOrderUpdates: (func: (orderUpdate: OrderUpdate) => void) => void;
  isConnected: () => void;
  disconnectTicker: () => void;
  connectTicker: () => void;
  subscribeTicker: (tokens: Array<DerivativeToken | EquityToken>) => void;
  unsubscribeTicker: (tokens: Array<DerivativeToken | EquityToken>) => void;
  registerForConnect: (func: () => void) => void;
  registerForDisconnect: (func: (error: any) => void) => void;
  registerForError: (func: (error: any) => void) => void;
  registerForClose: (func: () => void) => void;
  registerForReconnect: (func: () => void) => void;
  registerForNoreconnect: (func: () => void) => void;

}
