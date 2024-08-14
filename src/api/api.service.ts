import { AuthApiPort } from 'src/auth/auth.api.port'
import { DataApiPort } from 'src/data/data.api.port'
import { LiveApiPort } from 'src/live/live.api.port'
import { OrderApiPort } from 'src/order-manager/order.api.port'
import { BalancesApiPort } from 'src/portfolio/balances/balances.api.port'
import { HoldingsApiPort } from 'src/portfolio/holdings/holdings.api.port'
import { PositionsApiPort } from 'src/portfolio/positions/positions.api.port'
import { QuotesApiPort } from 'src/strategy/quotes.api.port'

export interface ApiService
  extends HoldingsApiPort,
    BalancesApiPort,
    PositionsApiPort,
    OrderApiPort,
    DataApiPort,
    LiveApiPort,
    QuotesApiPort,
    AuthApiPort {
  initialize: (...args: any) => Promise<void>
}

export const API_SERVICE = Symbol('ApiService')
