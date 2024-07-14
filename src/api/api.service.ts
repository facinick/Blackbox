import { Injectable } from '@nestjs/common';
import { KiteConnect, KiteTicker } from 'kiteconnect';
import { DataService } from 'src/data/data.service';
import { ConfigService } from '@nestjs/config';
import { HoldingsApiPort } from 'src/portfolio/holdings/holdings.api.port';
import { HoldingsMapper } from 'src/portfolio/holdings/holdings.zerodha.mapper';
import { BalancesMapper } from 'src/portfolio/balances/balances.zerodha.mapper';
import { BalancesApiPort } from 'src/portfolio/balances/balances.api.port';
import { PositionsMapper } from 'src/portfolio/positions/positions.zerodha.mapper';
import { PositionsApiPort } from 'src/portfolio/positions/positions.api.port';
import { AppLogger } from 'src/logger/logger.service';
import { OrdersMapper } from 'src/order-manager/order.zerodha.mapper';
import { OrderApiPort } from 'src/order-manager/order.api.port';
import { DataApiPort } from 'src/data/data.api.port';
import { InstrumentMapper } from 'src/data/data.zerodha.mapper';
import { LiveMapper, ZOrderUpdate, ZTick } from 'src/live/live.zerodha.mapper';
import { OrderUpdate, Tick } from 'src/live/live';
import { LiveApiPort } from 'src/live/live.api.port';
import { QuotesMapper } from 'src/strategy/quotes.zerodha.mapper';
import { QuotesApiPort } from 'src/strategy/quotes.api.port';

@Injectable()
export class ApiService implements 
    HoldingsApiPort, 
    BalancesApiPort, 
    PositionsApiPort, 
    OrderApiPort, 
    DataApiPort, 
    LiveApiPort,
    QuotesApiPort {
  
  private kc: KiteConnect;
  private ticker: KiteTicker | undefined;

  private tickListeners: Set<(ticks: Tick[]) => void> = new Set()
  private orderUpdateListeners: Set<(update: OrderUpdate) => void> = new Set()
  private wsConnectListeners: Set<() => void> = new Set()
  private wsDisconnectListeners: Set<(error: any) => void> = new Set()
  private wsErrorListeners: Set<(error: any) => void> = new Set()
  private wsCloseListeners: Set<() => void> = new Set()
  private wsReconnectListeners: Set<() => void> = new Set()
  private wsNoreconnectListeners: Set<() => void> = new Set()

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger
  ) {
    this.kc = new KiteConnect({
      api_key: configService.get("ZERODHA_API_KEY")
    });
    this.logger.setContext(this.constructor.name)
  }

  initializeTicker(accessToken) {
    this.ticker = new KiteTicker({
      api_key: this.configService.get("ZERODHA_API_KEY"),
      access_token: accessToken,
    });

    this.ticker.on('ticks', this._onTick)
    this.ticker.on('order_update', this._onOrderUpdate)
    this.ticker.on('connect', this._onConnect)
    this.ticker.on('disconnect', this._onDisconnect)
    this.ticker.on('error', this._onError)
    this.ticker.on('close', this._onClose)
    this.ticker.on('reconnect', this._onReconnect)
    this.ticker.on('noreconnect', this._onNoreconnect)
  }

  cancelOrder = async (cancelOrderDto: { orderId: string }) => {
    const { orderId } = cancelOrderDto;

    return (await this.kc.cancelOrder(KiteConnect['VARIETY_REGULAR'], orderId))
      .order_id;
  }

  placeOrder = async (placeOrderDto: {
    tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol;
    buyOrSell: BuyOrSell;
    quantity: number;
  }): Promise<string> => {
    const { tradingsymbol, buyOrSell, quantity } = placeOrderDto;

    let exchange, product;

    if (
      DataService.isCallOption(tradingsymbol as DerivativeTradingsymbol) ||
      DataService.isPutOption(tradingsymbol as DerivativeTradingsymbol)
    ) {
      exchange = KiteConnect['EXCHANGE_NFO'];
      product = KiteConnect['PRODUCT_NRML'];
    } else {
      exchange = KiteConnect['EXCHANGE_NSE'];
      product = KiteConnect['PRODUCT_CNC'];
    }

    return (
      await this.kc.placeOrder(KiteConnect['VARIETY_REGULAR'], {
        exchange,
        tradingsymbol,
        transaction_type: buyOrSell,
        quantity,
        product,
        order_type: KiteConnect['ORDER_TYPE_LIMIT'],
      })
    ).order_id;
  }

  getOrders = async () => {
    const zOrders = await this.kc.getOrders()
    const orders = zOrders.map(OrdersMapper.toDomain)
    return orders
  }

  modifyOrderPrice = async (modifyPriceDto: { orderId: string; price: number }) =>  {
    const { orderId, price } = modifyPriceDto;

    return (
      await this.kc.modifyOrder(KiteConnect['VARIETY_REGULAR'], orderId, {
        price,
      })
    ).order_id;
  }

  getHoldings = async () => {
    const zHoldings = await this.kc.getHoldings()
    // this.logger.debug(`fetched holdings from broker:`,zHoldings)
    const holdings = zHoldings.map(HoldingsMapper.toDomain)
    return holdings
  }

  getNetPositions = async () => {
    const zPositions = await this.kc.getPositions()
    // this.logger.debug(`fetched positions from broker:`,zPositions)
    const Positions = zPositions.net.map(PositionsMapper.toDomain)
    return Positions
  }

  getTradableEquities = async () => {
    const zInstruments = await this.kc.getInstruments(KiteConnect['EXCHANGE_NSE'])
    // this.logger.debug(`fetched tradable eq instruments from broker:`)
    console.log(zInstruments)
    const instruments = zInstruments.map(InstrumentMapper.toDomain)
    return instruments
  }

  getTradableDerivatives = async () => {
    const zInstruments = await this.kc.getInstruments(KiteConnect['EXCHANGE_NFO'])
    // this.logger.debug(`fetched tradable eq instruments from broker:`)
    const instruments = zInstruments.map(InstrumentMapper.toDomain)
    return instruments
  }

  getBalance = async () => {
    const zBalance = await this.kc.getMargins(KiteConnect['MARGIN_EQUITY'])
    this.logger.debug(`fetched balance from broker:`,zBalance)
    const balance = BalancesMapper.toDomain(zBalance)
    return balance
  }

  generateSession = async (requestToken: string, api_secret: string) => {
    return await this.kc.generateSession(requestToken, api_secret);
  }

  invalidateAccessToken = async (accessToken: string) => {
    return this.kc.invalidateAccessToken(accessToken);
  }

  invalidateRefreshToken = async (refreshToken: string) => {
    return this.kc.invalidateRefreshToken(refreshToken);
  }

  getLoginURL = async () => {
    return await this.kc.getLoginURL();
  }

  getStockLtp = async (tradingSymbols: Array<EquityTradingsymbol>) => {
    const instruments = tradingSymbols.map(tradingSymbol => `${KiteConnect['EXCHANGE_NSE']}:${tradingSymbol}`)
    const quotes = await this.kc.getLTP(instruments)
    return QuotesMapper.toDomain(quotes)
  }

  getDerivativeLtp = async (tradingSymbols: Array<DerivativeTradingsymbol>) => {
    const instruments = tradingSymbols.map(tradingSymbol => `${KiteConnect['EXCHANGE_NFO']}:${tradingSymbol}`)
    const quotes = await this.kc.getLTP(instruments)
    return QuotesMapper.toDomain(quotes)
  }

  // getLtp = async (tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol, => )

  renewAccessToken = async (refresh_token: string, api_secret: string) => {
    return await this.kc.renewAccessToken(refresh_token, api_secret);
  }

  setAccessToken = (access_token: string) => {
    this.kc.setAccessToken(access_token);
  }

  /*
   * Websocket stuff
   */

  connectTicker = () => {
    this.ticker.connect();
  }

  subscribeTicker = (tokens: Array<DerivativeToken | EquityToken>) => {
    this.ticker.subscribe(tokens);
  }

  unsubscribeTicker = (tokens: Array<DerivativeToken | EquityToken>) => {
    this.ticker.unsubscribe(tokens);
  }

  isConnected = () => {
    return this.ticker.connected();
  }

  disconnectTicker = () => {
    this.ticker.disconnect();
  }

  registerForPriceUpdates = (func: (ticks: Tick[]) => void) => {
    if(!this.tickListeners.has(func)) {
      this.tickListeners.add(func)
    }
  }

  private _onTick = (zTicks: ZTick[]) => {
    this.tickListeners.forEach(listener => {
      listener(zTicks.map(LiveMapper.Tick.toDomain))
    });
  }

  registerForOrderUpdates = (func: (orderUpdate: OrderUpdate) => void) => {
    if(!this.orderUpdateListeners.has(func)) {
      this.orderUpdateListeners.add(func)
    }
  }

  private _onOrderUpdate = (zUpdate: ZOrderUpdate) => {
    this.orderUpdateListeners.forEach(listener => {
      listener(LiveMapper.OrderUpdate.toDomain(zUpdate))
    });
  }

  registerForConnect = (func: () => void) => {
    if(!this.wsConnectListeners.has(func)) {
      this.wsConnectListeners.add(func)
    }
  }

  private _onConnect = () => {
    this.wsConnectListeners.forEach(listener => {
      listener()
    });
  }

  registerForDisconnect = (func: (error: any) => void) => {
    if(!this.wsDisconnectListeners.has(func)) {
      this.wsDisconnectListeners.add(func)
    }
  }

  private _onDisconnect = (error: any) => {
    this.wsDisconnectListeners.forEach(listener => {
      listener(error)
    });
  }

  registerForError = (func: (error: any) => void) => {
    if(!this.wsErrorListeners.has(func)) {
      this.wsErrorListeners.add(func)
    }
  }

  private _onError = (error) => {
    this.wsErrorListeners.forEach(listener => {
      listener(error)
    });
  }

  registerForClose = (func: () => void) => {
    if(!this.wsCloseListeners.has(func)) {
      this.wsCloseListeners.add(func)
    }
  }

  private _onClose = () => {
    this.wsCloseListeners.forEach(listener => {
      listener()
    });
  }

  registerForReconnect = (func: () => void) => {
    if(!this.wsReconnectListeners.has(func)) {
      this.wsReconnectListeners.add(func)
    }
  }

  private _onReconnect = () => {
    this.wsReconnectListeners.forEach(listener => {
      listener()
    });
  }

  registerForNoreconnect = (func: () => void) => {
    if(!this.wsNoreconnectListeners.has(func)) {
      this.wsNoreconnectListeners.add(func)
    }
  }

  private _onNoreconnect = () => {
    this.wsNoreconnectListeners.forEach(listener => {
      listener()
    });
  }

}
