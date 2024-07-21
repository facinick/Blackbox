import { Injectable } from '@nestjs/common'
import { KiteConnect, KiteTicker } from 'kiteconnect'
import { DataService } from 'src/data/data.service'
import { InstrumentMapper } from 'src/data/data.zerodha.mapper'
import { OrderUpdate, Tick } from 'src/live/live'
import { AppLogger } from 'src/logger/logger.service'
import { OrdersMapper } from 'src/order-manager/order.zerodha.mapper'
import { BalancesMapper } from 'src/portfolio/balances/balances.zerodha.mapper'
import { HoldingsMapper } from 'src/portfolio/holdings/holdings.zerodha.mapper'
import { PositionsMapper } from 'src/portfolio/positions/positions.zerodha.mapper'
import { QuotesMapper } from 'src/strategy/quotes.zerodha.mapper'
import { ApiService } from '../api.service'
import { LiveMapper } from 'src/live/live.zerodha.mapper'
import { ZOrderUpdate } from 'src/types/thirdparty/order-update'
import { ZTick } from 'src/types/thirdparty/tick'

@Injectable()
export class ZerodhaApiService implements ApiService {
  private kc: KiteConnect
  private ticker: KiteTicker | undefined

  private tickListeners: Set<(ticks: Tick[]) => void> = new Set()
  private orderUpdateListeners: Set<(update: OrderUpdate) => void> = new Set()
  private wsConnectListeners: Set<() => void> = new Set()
  private wsDisconnectListeners: Set<(error: any) => void> = new Set()
  private wsErrorListeners: Set<(error: any) => void> = new Set()
  private wsCloseListeners: Set<() => void> = new Set()
  private wsReconnectListeners: Set<() => void> = new Set()
  private wsNoreconnectListeners: Set<() => void> = new Set()

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async (accessToken: string, apiKey: string): Promise<void> => {
    try {
      this.kc = new KiteConnect({ api_key: apiKey })
      this.setAccessToken(accessToken)
      await this.kc.getProfile()
      this.initializeTicker(accessToken, apiKey)
    } catch (error) {
      this.logger.error('Error initializing KiteConnect', error)
      throw error
    }
  }

  initializeTicker(accessToken: string, apiKey: string) {
    try {
      this.ticker = new KiteTicker({
        api_key: apiKey,
        access_token: accessToken,
      })
      this.ticker.on('ticks', this._onTick)
      this.ticker.on('order_update', this._onOrderUpdate)
      this.ticker.on('connect', this._onConnect)
      this.ticker.on('disconnect', this._onDisconnect)
      this.ticker.on('error', this._onError)
      this.ticker.on('close', this._onClose)
      this.ticker.on('reconnect', this._onReconnect)
      this.ticker.on('noreconnect', this._onNoreconnect)
    } catch (error) {
      this.logger.error('Error initializing ticker', error)
      throw error
    }
  }

  cancelOrder = async ({ orderId }) => {
    try {
      this.logger.debug(`cancel order:`, orderId)
      const cancelledOrder = await this.kc.cancelOrder('regular', orderId)
      return {
        brokerOrderId: cancelledOrder.order_id,
      }
    } catch (error) {
      this.logger.error('Error canceling order', error)
      throw error
    }
  }

  // getProfile = async (): Promise<Profile> => {
  //   try {
  //     const profile = await this.kc.getProfile()
  //     return {
  //       userId: profile.user_id
  //     };
  //   } catch (error) {
  //     this.logger.error('Error getting profile', error);
  //     throw error;
  //   }
  // }

  placeOrder = async ({ tradingsymbol, buyOrSell, quantity, price, tag }) => {
    try {
      let exchange, product

      if (
        DataService.isCallOption(tradingsymbol as DerivativeTradingsymbol) ||
        DataService.isPutOption(tradingsymbol as DerivativeTradingsymbol)
      ) {
        exchange = 'NFO'
        product = 'NRML'
      } else {
        exchange = 'NSE'
        product = 'CNC'
      }

      const order = {
        exchange,
        tradingsymbol,
        transaction_type: buyOrSell,
        quantity,
        product,
        price,
        tag,
        order_type: 'LIMIT',
      }

      this.logger.debug(`place order:`, order)
      //@ts-expect-error orderType expected by kc is specific string, provided is a string
      const placedOrder = await this.kc.placeOrder('regular', order)
      return {
        brokerOrderId: placedOrder.order_id,
      }
    } catch (error) {
      this.logger.error('Error placing order', error)
      throw error
    }
  }

  getTodaysOrders = async () => {
    try {
      const zOrders = await this.kc.getOrders()
      const orders = zOrders.map(OrdersMapper.Orders.toDomain)
      return orders
    } catch (error) {
      this.logger.error('Error getting orders', error)
      throw error
    }
  }

  getOrderHistory = async ({ brokerOrderId }) => {
    try {
      const zOrderHistory = await this.kc.getOrderHistory(brokerOrderId)
      const orderHistory = zOrderHistory.map(OrdersMapper.OrderHistory.toDomain)
      return orderHistory
    } catch (error) {
      this.logger.error('Error getting order history', error)
      throw error
    }
  }

  getOrderTrades = async ({ brokerOrderId }) => {
    try {
      const zOrderTrades = await this.kc.getOrderTrades(brokerOrderId)
      const OrderTrades = zOrderTrades.map(OrdersMapper.Trade.toDomain)
      return OrderTrades
    } catch (error) {
      this.logger.error('Error getting order trades', error)
      throw error
    }
  }

  modifyOrderPrice = async ({ orderId, price }) => {
    try {
      this.logger.debug(`modify order:`, orderId)
      const modifiedOrder = await this.kc.modifyOrder('regular', orderId, {
        price,
      })
      return {
        brokerOrderId: modifiedOrder.order_id,
      }
    } catch (error) {
      this.logger.error('Error modifying order price', error)
      throw error
    }
  }

  getHoldings = async () => {
    try {
      const zHoldings = await this.kc.getHoldings()
      this.logger.debug(`fetched holdings from broker:`, zHoldings)
      const holdings = zHoldings.map(HoldingsMapper.toDomain)
      return holdings
    } catch (error) {
      this.logger.error('Error getting holdings', error)
      throw error
    }
  }

  getNetPositions = async () => {
    try {
      const zPositions = await this.kc.getPositions()
      this.logger.debug(`fetched positions from broker:`, zPositions)
      const Positions = zPositions.net.map(PositionsMapper.toDomain)
      return Positions
    } catch (error) {
      this.logger.error('Error getting net positions', error)
      throw error
    }
  }

  getTradableEquities = async () => {
    try {
      const zInstruments = await this.kc.getInstruments('NSE')
      const instruments = zInstruments.map(InstrumentMapper.toDomain)
      return instruments
    } catch (error) {
      this.logger.error('Error getting tradable equities', error)
      throw error
    }
  }

  getTradableDerivatives = async () => {
    try {
      const zInstruments = await this.kc.getInstruments('NFO')
      const instruments = zInstruments.map(InstrumentMapper.toDomain)
      return instruments
    } catch (error) {
      this.logger.error('Error getting tradable derivatives', error)
      throw error
    }
  }

  getBalance = async () => {
    try {
      const zBalance = await this.kc.getMargins()
      this.logger.debug(`fetched balance from broker:`, zBalance)
      const balance = BalancesMapper.toDomain(zBalance)
      return balance
    } catch (error) {
      this.logger.error('Error getting balance', error)
      throw error
    }
  }

  generateSession = async (requestToken: string, api_secret: string) => {
    try {
      return await this.kc.generateSession(requestToken, api_secret)
    } catch (error) {
      this.logger.error('Error generating session', error)
      throw error
    }
  }

  invalidateAccessToken = async (accessToken: string) => {
    try {
      return this.kc.invalidateAccessToken(accessToken)
    } catch (error) {
      this.logger.error('Error invalidating access token', error)
      throw error
    }
  }

  invalidateRefreshToken = async (refreshToken: string) => {
    try {
      return this.kc.invalidateRefreshToken(refreshToken)
    } catch (error) {
      this.logger.error('Error invalidating refresh token', error)
      throw error
    }
  }

  getLoginURL = () => {
    try {
      return this.kc.getLoginURL()
    } catch (error) {
      this.logger.error('Error getting login URL', error)
      throw error
    }
  }

  getStockLtp = async (tradingsymbols: Array<EquityTradingsymbol>) => {
    try {
      const instruments = tradingsymbols.map(
        (tradingSymbol) => `NSE:${tradingSymbol}`,
      )
      const quotes = await this.kc.getLTP(instruments)
      return QuotesMapper.toDomain(quotes)
    } catch (error) {
      this.logger.error('Error getting stock LTP', error)
      throw error
    }
  }

  getDerivativeLtp = async (tradingsymbols: Array<DerivativeTradingsymbol>) => {
    try {
      const instruments = tradingsymbols.map(
        (tradingSymbol) => `NFO:${tradingSymbol}`,
      )
      const quotes = await this.kc.getLTP(instruments)
      return QuotesMapper.toDomain(quotes)
    } catch (error) {
      this.logger.error('Error getting derivative LTP', error)
      throw error
    }
  }

  // getLtp = async (tradingsymbol: EquityTradingsymbol | DerivativeTradingsymbol, => )

  renewAccessToken = async (refresh_token: string, api_secret: string) => {
    try {
      return await this.kc.renewAccessToken(refresh_token, api_secret)
    } catch (error) {
      this.logger.error('Error renewing access token', error)
      throw error
    }
  }

  setAccessToken = (access_token: string) => {
    try {
      this.kc.setAccessToken(access_token)
    } catch (error) {
      this.logger.error('Error setting access token', error)
      throw error
    }
  }

  /*
   * Websocket stuff
   */

  connectTicker = () => {
    try {
      this.ticker.connect()
    } catch (error) {
      this.logger.error('Error connecting ticker', error)
      throw error
    }
  }

  subscribeTicker = (tokens: Array<DerivativeToken | EquityToken>) => {
    try {
      this.ticker.subscribe(tokens)
    } catch (error) {
      this.logger.error('Error subscribing to ticker', error)
      throw error
    }
  }

  unsubscribeTicker = (tokens: Array<DerivativeToken | EquityToken>) => {
    try {
      this.ticker.unsubscribe(tokens)
    } catch (error) {
      this.logger.error('Error unsubscribing from ticker', error)
      throw error
    }
  }

  isConnected = () => {
    try {
      return this.ticker.connected()
    } catch (error) {
      this.logger.error('Error checking ticker connection status', error)
      throw error
    }
  }

  disconnectTicker = () => {
    try {
      this.ticker.disconnect()
    } catch (error) {
      this.logger.error('Error disconnecting ticker', error)
      throw error
    }
  }

  registerForPriceUpdates = (func: (ticks: Tick[]) => void) => {
    try {
      if (!this.tickListeners.has(func)) {
        this.tickListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for price updates', error)
      throw error
    }
  }

  private _onTick = (zTicks: ZTick[]) => {
    try {
      this.tickListeners.forEach((listener) => {
        listener(zTicks.map(LiveMapper.Tick.toDomain))
      })
    } catch (error) {
      this.logger.error('Error processing ticks', error)
      throw error
    }
  }

  registerForOrderUpdates = (func: (orderUpdate: OrderUpdate) => void) => {
    try {
      if (!this.orderUpdateListeners.has(func)) {
        this.orderUpdateListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for order updates', error)
      throw error
    }
  }

  private _onOrderUpdate = (zUpdate: ZOrderUpdate) => {
    try {
      this.orderUpdateListeners.forEach((listener) => {
        listener(LiveMapper.OrderUpdate.toDomain(zUpdate))
      })
    } catch (error) {
      this.logger.error('Error processing order update', error)
      throw error
    }
  }

  registerForConnect = (func: () => void) => {
    try {
      if (!this.wsConnectListeners.has(func)) {
        this.wsConnectListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for connect event', error)
      throw error
    }
  }

  private _onConnect = () => {
    try {
      this.wsConnectListeners.forEach((listener) => {
        listener()
      })
    } catch (error) {
      this.logger.error('Error processing connect event', error)
      throw error
    }
  }

  registerForDisconnect = (func: (error: any) => void) => {
    try {
      if (!this.wsDisconnectListeners.has(func)) {
        this.wsDisconnectListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for disconnect event', error)
      throw error
    }
  }

  private _onDisconnect = (error: any) => {
    try {
      this.wsDisconnectListeners.forEach((listener) => {
        listener(error)
      })
    } catch (error) {
      this.logger.error('Error processing disconnect event', error)
      throw error
    }
  }

  registerForError = (func: (error: any) => void) => {
    try {
      if (!this.wsErrorListeners.has(func)) {
        this.wsErrorListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for error event', error)
      throw error
    }
  }

  private _onError = (error) => {
    try {
      this.wsErrorListeners.forEach((listener) => {
        listener(error)
      })
    } catch (error) {
      this.logger.error('Error processing error event', error)
      throw error
    }
  }

  registerForClose = (func: () => void) => {
    try {
      if (!this.wsCloseListeners.has(func)) {
        this.wsCloseListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for close event', error)
      throw error
    }
  }

  private _onClose = () => {
    try {
      this.wsCloseListeners.forEach((listener) => {
        listener()
      })
    } catch (error) {
      this.logger.error('Error processing close event', error)
      throw error
    }
  }

  registerForReconnect = (func: () => void) => {
    try {
      if (!this.wsReconnectListeners.has(func)) {
        this.wsReconnectListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for reconnect event', error)
      throw error
    }
  }

  private _onReconnect = () => {
    try {
      this.wsReconnectListeners.forEach((listener) => {
        listener()
      })
    } catch (error) {
      this.logger.error('Error processing reconnect event', error)
      throw error
    }
  }

  registerForNoreconnect = (func: () => void) => {
    try {
      if (!this.wsNoreconnectListeners.has(func)) {
        this.wsNoreconnectListeners.add(func)
      }
    } catch (error) {
      this.logger.error('Error registering for noreconnect event', error)
      throw error
    }
  }

  private _onNoreconnect = () => {
    try {
      this.wsNoreconnectListeners.forEach((listener) => {
        listener()
      })
    } catch (error) {
      this.logger.error('Error processing noreconnect event', error)
      throw error
    }
  }
}
