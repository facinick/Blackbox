import { Injectable } from '@nestjs/common';
import { KiteConnect, KiteTicker } from 'kiteconnect';
import { ZOrderUpdate, ZTick } from 'src/live/live.service';
import { DataService } from 'src/data/data.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiService {
  private kc: KiteConnect;
  private ticker: KiteTicker | undefined;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.kc = new KiteConnect({
      api_key: configService.get("ZERODHA_API_KEY")
    });
  }

  initializeTicker(accessToken) {
    this.ticker = new KiteTicker({
      api_key: this.configService.get("ZERODHA_API_KEY"),
      access_token: accessToken,
    });
  }

  async cancelOrder(cancelOrderDto: { orderId: string }) {
    const { orderId } = cancelOrderDto;

    return (await this.kc.cancelOrder(KiteConnect['VARIETY_REGULAR'], orderId))
      .order_id;
  }

  async placeOrder(placeOrderDto: {
    tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol;
    buyOrSell: BuyOrSell;
    quantity: number;
  }): Promise<string> {
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

  async getOrders() {
    return this.kc.getOrders();
  }

  async modifyPrice(modifyPriceDto: { orderId: string; price: number }) {
    const { orderId, price } = modifyPriceDto;

    return (
      await this.kc.modifyOrder(KiteConnect['VARIETY_REGULAR'], orderId, {
        price,
      })
    ).order_id;
  }

  async getHoldings() {
    return this.kc.getHoldings();
  }

  async getPositions() {
    return this.kc.getPositions();
  }

  async getNetDerivativePositions() {
    return (await this.kc.getPositions()).net.filter((position => position.exchange === KiteConnect['EXCHANGE_NFO'] || position.exchange === KiteConnect['EXCHANGE_BFO']));
  }

  async getAvailableEquities() {
    return this.kc.getInstruments(KiteConnect['EXCHANGE_NSE']);
  }

  async getAvailableDerivatives() {
    return this.kc.getInstruments(KiteConnect['EXCHANGE_NFO']);
  }

  async getMargins() {
    return await this.kc.getMargins(KiteConnect['MARGIN_EQUITY']);
  }

  async generateSession(requestToken: string, api_secret: string) {
    return await this.kc.generateSession(requestToken, api_secret);
  }

  async invalidateAccessToken(accessToken: string) {
    return this.kc.invalidateAccessToken(accessToken);
  }

  async invalidateRefreshToken(refreshToken: string) {
    return this.kc.invalidateRefreshToken(refreshToken);
  }

  async getLoginURL() {
    return await this.kc.getLoginURL();
  }

  async getStockLtp(tradingSymbol: EquityTradingsymbol) {
    return await this.kc.getLTP(
      `${KiteConnect['EXCHANGE_NSE']}:${tradingSymbol}`,
    );
  }

  async getDerivativeLtp(tradingSymbol: DerivativeTradingsymbol) {
    return await this.kc.getLTP(
      `${KiteConnect['EXCHANGE_NFO']}:${tradingSymbol}`,
    );
  }

  // async getLtp(tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol, )

  async renewAccessToken(refresh_token: string, api_secret: string) {
    return await this.kc.renewAccessToken(refresh_token, api_secret);
  }

  setAccessToken(access_token: string) {
    this.kc.setAccessToken(access_token);
  }

  /*
   * Websocket stuff
   */

  connectTicker() {
    this.ticker.connect();
  }

  subscribeTicker(tokens: Array<DerivativeToken | EquityToken>) {
    this.ticker.subscribe(tokens);
  }

  unsubscribeTicker(tokens: Array<DerivativeToken | EquityToken>) {
    this.ticker.unsubscribe(tokens);
  }

  registerForOrderUpdates(func: (orderUpdate: ZOrderUpdate) => void) {
    this.ticker.on('order_update', func);
  }

  registerForConnect(func: () => void) {
    this.ticker.on('connect', func);
  }

  registerForError(func: (error: any) => void) {
    this.ticker.on('error', func);
  }

  registerForPriceUpdates(func: (tick: ZTick) => void) {
    this.ticker.on('ticks', func);
  }

  isConnected() {
    return this.ticker.connected();
  }

  disconnectTicker() {
    this.ticker.disconnect();
  }
}
