import { KiteConnect } from "kiteconnect"
import { Derivative, Equity } from "./data"
import { DataService } from "./data.service"

export const DataMapper = {
    Equity: {
        toDomain: (equity: Awaited<ReturnType<KiteConnect['getInstruments']>>[number]): Equity => {
            const token = parseInt(equity.instrument_token) as EquityToken
            const tradingsymbol = equity.tradingsymbol as EquityTradingsymbol
            const tickSize = equity.tick_size as EquityTickSize
            const instrumentType = equity.instrument_type as EquityInstrumentType
            const exchange = equity.exchange as EquityExchange
            const segment = equity.segment as EquitySegment
        
            return {
              token,
              tradingsymbol,
              tickSize,
              instrumentType,
              exchange,
              segment,
              calls: [],
              puts: [],
            }
        }
    },
    Derivative: {
        toDomain: (derivative: Awaited<ReturnType<KiteConnect['getInstruments']>>[number]): Derivative => {
            const token = parseInt(derivative.instrument_token) as DerivativeToken
            const name = derivative.name as DerivativeName
            const tradingsymbol = derivative.tradingsymbol as DerivativeTradingsymbol
            const tradingsymbolParsed = DataService.parseDerivativeTradingSymbol(
              derivative.tradingsymbol as DerivativeTradingsymbol,
            )
            const expiry = String(derivative.expiry) as DerivativeExpiry
            const expiryParsed = DataService.parseExpiry(
                String(derivative.expiry),
            ) as DerivativeExpiryParsed
            const strike = derivative.strike as StrikePrice
            const tickSize = derivative.tick_size as DerivativeTickSize
            const stepSize = 0 // to be calculated while linking
            const lotSize = derivative.lot_size as DerivativeLotSize
            const instrumentType = derivative.instrument_type as DerivativeInstrumentType
            const exchange = derivative.exchange as DerivativeExchange
            const segment = derivative.segment as DerivativeSegment
        
            return {
              token,
              name,
              tradingsymbol,
              tradingsymbolParsed,
              expiry,
              stepSize,
              expiryParsed,
              strike,
              tickSize,
              lotSize,
              instrumentType,
              exchange,
              segment,
            }
        }
    }
}