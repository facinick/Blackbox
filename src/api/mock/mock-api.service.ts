import { Injectable } from '@nestjs/common'
import { OrderUpdate, Tick } from 'src/live/live'
import { Balance } from 'src/portfolio/balances/Balances'
import { Holding } from 'src/portfolio/holdings/holdings'
import { Position } from 'src/portfolio/positions/Positions'
import { ApiService } from '../api.service'
import { balance, holdings, instruments, netPositions } from './data'
import { OrdersMapper } from 'src/order-manager/order.zerodha.mapper'
import { KiteConnect } from 'kiteconnect'
import { ZOrderUpdate, ZTick } from '../zerodha/types'
import { LiveMapper } from 'src/live/live.zerodha.mapper'
import { NseTicker } from './NseTicker'
import { AppLogger } from 'src/logger/logger.service'
import * as path from 'path'
import { DataService } from 'src/data/data.service'

const getFakeBrokerId = () => (Math.random() * 1000).toFixed(0)

@Injectable()
export class MockApiService implements ApiService {

  tickListeners: Set<(ticks: Tick[]) => void> = new Set()
  orderUpdateListeners: Set<(update: OrderUpdate) => void> = new Set()
  wsConnectListeners: Set<() => void> = new Set()
  wsDisconnectListeners: Set<(error: any) => void> = new Set()
  wsErrorListeners: Set<(error: any) => void> = new Set()
  wsCloseListeners: Set<() => void> = new Set()
  wsReconnectListeners: Set<() => void> = new Set()
  wsNoreconnectListeners: Set<() => void> = new Set()

  positions: Position[] = netPositions
  holdings: Holding[] = holdings
  balance: Balance = balance

  zOrders: Awaited<ReturnType<KiteConnect['getOrders']>> = []

  ticker: NseTicker
  // null or a non-zero number in case of an ongoing interval
  tickerIntervalId: NodeJS.Timeout = null

  constructor(
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async (...args: any) => {
    this.logger.log(`initializing mock api service`)
    this.ticker = new NseTicker(path.join(process.cwd(), 'historical_data'));
    await this.ticker.initialize()
    this.logger.log(`ticker initialized`)
    return
  }

  getHoldings = async () => {
    return this.holdings
  }

  getBalance = async () => {
    return this.balance
  }

  getNetPositions = async () => {
    return this.positions
  }

  placeOrder = async ({ tradingsymbol, buyOrSell, quantity, price, tag }) => {

    const brokerOrderId = getFakeBrokerId()
    
    const instrumentData = instruments.filter((instrument) => instrument.tradingsymbol === tradingsymbol)[0]

    const zOrder = {
      order_id: brokerOrderId,
      tradingsymbol,
      instrument_token: instrumentData.token,
      quantity,
      price,
      transaction_type: buyOrSell,
      exchange: 'NSE',
      tag,
      status: 'OPEN',
      average_price: 0,
      pending_quantity: quantity,
      //---------------------------------
      filled_quantity: 0,
      cancelled_quantity: 0,
      parent_order_id: '',
      exchange_order_id: '',
      placed_by: '',
      variety: '',
      order_type: '',
      product: '',
      validity: '',
      trigger_price: 0,
      disclosed_quantity: 0,
      order_timestamp: undefined,
      exchange_timestamp: undefined,
      exchange_update_timestamp: '',
      status_message: '',
      status_message_raw: '',
      meta: '',
      guid: '',
      market_protection: 0
    }

    this.zOrders.push(zOrder)

    this._onOrderUpdate({
      ...zOrder,
      user_id: '',
      unfilled_quantity: 0,
      app_id: 0,
      checksum: '',
    })

    setTimeout(()=> this.markOpenOrdersComplete(), 9_000)

    this.logger.debug(`Placed order with id:${brokerOrderId}`)

    return {
      brokerOrderId
    }
  }

  markOpenOrdersComplete = () => {
    this.zOrders.forEach((zOrder) => {
      if (zOrder.status === "OPEN") {
        zOrder.status = "COMPLETE"
        zOrder.filled_quantity = zOrder.quantity
        zOrder.average_price = zOrder.price
      }

      this._onOrderUpdate({
        ...zOrder,
        user_id: '',
        unfilled_quantity: 0,
        app_id: 0,
        checksum: '',
      })
  
      this.logger.debug(`Completed order with id:${zOrder.order_id}`)
    });
  }

  markOpenOrdersRejected= () => {
    this.zOrders.forEach((zOrder) => {
      if (zOrder.status === "OPEN") {
        zOrder.status = "REJECTED"
      }

      this._onOrderUpdate({
        ...zOrder,
        user_id: '',
        unfilled_quantity: 0,
        app_id: 0,
        checksum: '',
      })
  
      this.logger.debug(`Rejected order with id:${zOrder.order_id}`)
    });
  }

  modifyOrderPrice = async ({ orderId, price }) => {
    const orderIndex = this.zOrders.findIndex(order => order.order_id === orderId);
    
    this.zOrders[orderIndex].status = "UPDATE";
    this.zOrders[orderIndex].price = price

    this._onOrderUpdate({
      ...this.zOrders[orderIndex],
      user_id: '',
      unfilled_quantity: 0,
      app_id: 0,
      checksum: '',
    })

    this.logger.debug(`Modified order with id:${orderId}`)
    return {
      brokerOrderId: orderId
    }
  }
  
  cancelOrder = async ({ orderId }) => {
    const orderIndex = this.zOrders.findIndex(order => order.order_id === orderId);
    
    this.zOrders[orderIndex].status = "CANCELLED";
    this.zOrders[orderIndex].cancelled_quantity = this.zOrders[orderIndex].quantity

    this._onOrderUpdate({
      ...this.zOrders[orderIndex],
      user_id: '',
      unfilled_quantity: 0,
      app_id: 0,
      checksum: '',
    })

    this.logger.debug(`Cancelled order with id:${orderId}`)

    return {
      brokerOrderId: orderId
    }
  }
  
  getOrders = async () => {
    return this.zOrders.map(OrdersMapper.toDomain)
  }

  getTradableEquities = async () => {
    return instruments
  }

  getTradableDerivatives = async () => {
    return instruments
  }

  getStockLtp = async (
    tradingsymbols: Array<EquityTradingsymbol>,
  ) => {

    const latestTicks = this.ticker.peek()

    const ltps: Record<EquityTradingsymbol, Tick> = {}

    tradingsymbols.forEach((tradingsymbol) => {
      const equityInfo = DataService.getEquityInfoFromTradingsymbol(tradingsymbol)
      const tick = latestTicks.filter((tick) => tick.instrument_token === equityInfo.token)[0]
      ltps[tradingsymbol] = {
        price: tick.last_price,
        token: tick.instrument_token
      }
    })

    return ltps
  }

  getDerivativeLtp = async (
    tradingsymbols: Array<DerivativeTradingsymbol>,
  ) => {
    const latestTicks = this.ticker.peek()

    const ltps: Record<DerivativeTradingsymbol, Tick> = {}

    tradingsymbols.forEach((tradingsymbol) => {
      const equityInfo = DataService.getDerivativeInfoFromTradingSymbol(tradingsymbol)
      const tick = latestTicks.filter((tick) => tick.instrument_token === equityInfo.token)[0]
      ltps[tradingsymbol] = {
        price: tick.last_price,
        token: tick.instrument_token
      }
    })

    return ltps
  }


  subscribeTicker = (tokens: Array<DerivativeToken | EquityToken>) => {
    // this.ticker.subscribe(tokens)
  }


  unsubscribeTicker = (tokens: Array<DerivativeToken | EquityToken>) => {
    // this.ticker.unsubscribe(tokens)
  }

  _onTick = (zTicks: ZTick[]) => {
    this.tickListeners.forEach((listener) => {
      listener(zTicks.map(LiveMapper.Tick.toDomain))
    })
  }

  _onOrderUpdate = (zUpdate: ZOrderUpdate) => {
    this.orderUpdateListeners.forEach((listener) => {
      listener(LiveMapper.OrderUpdate.toDomain(zUpdate))
    })
  }

  connectTicker = () => {
    const gen = this.ticker.generator('2024-07-01T09:15:00', '2030-07-19T15:30:00');
    this.logger.log(`ticker ready to generate ticks from 2024-07-01T09:15:00 to 2024-07-19T15:30:00`)
    gen.next().value // to let getLtp work

    this.tickerIntervalId = setInterval(()=> {
      const ticks = gen.next().value
      if(ticks && ticks.length > 0) {
        this._onTick(ticks)
      }
    }, 30_000)

    this._onConnect()
    return
  }

  isConnected = () => {
    return this.tickerIntervalId !== null
  }

  disconnectTicker = () => {
    clearInterval(this.tickerIntervalId)
    this.tickerIntervalId = null
    this._onClose()
    return
  }

  registerForPriceUpdates = (func: (ticks: Tick[]) => void) => {
    if (!this.tickListeners.has(func)) {
      this.tickListeners.add(func)
    }
  }

  registerForOrderUpdates = (func: (orderUpdate: OrderUpdate) => void) => {
    if (!this.orderUpdateListeners.has(func)) {
      this.orderUpdateListeners.add(func)
    }
  }

  registerForConnect = (func: () => void) => {
    if (!this.wsConnectListeners.has(func)) {
      this.wsConnectListeners.add(func)
    }
  }

  _onConnect = () => {
    this.wsConnectListeners.forEach((listener) => {
      listener()
    })
  }

  registerForDisconnect = (func: (error: any) => void) => {
    if (!this.wsDisconnectListeners.has(func)) {
      this.wsDisconnectListeners.add(func)
    }
  }

  _onDisconnect = (error: any) => {
    this.wsDisconnectListeners.forEach((listener) => {
      listener(error)
    })
  }

  registerForError = (func: (error: any) => void) => {
    if (!this.wsErrorListeners.has(func)) {
      this.wsErrorListeners.add(func)
    }
  }

  _onError = (error) => {
    this.wsErrorListeners.forEach((listener) => {
      listener(error)
    })
  }

  registerForClose = (func: () => void) => {
    if (!this.wsCloseListeners.has(func)) {
      this.wsCloseListeners.add(func)
    }
  }

  _onClose = () => {
    this.wsCloseListeners.forEach((listener) => {
      listener()
    })
  }

  registerForReconnect = (func: () => void) => {
    if (!this.wsReconnectListeners.has(func)) {
      this.wsReconnectListeners.add(func)
    }
  }

  _onReconnect = () => {
    this.wsReconnectListeners.forEach((listener) => {
      listener()
    })
  }

  registerForNoreconnect = (func: () => void) => {
    if (!this.wsNoreconnectListeners.has(func)) {
      this.wsNoreconnectListeners.add(func)
    }
  }

  _onNoreconnect = () => {
    this.wsNoreconnectListeners.forEach((listener) => {
      listener()
    })
  }
}
