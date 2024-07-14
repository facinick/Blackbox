import { KiteConnect } from "kiteconnect"
import { Derivative, Equity, Instrument } from "./data"
import { DataService } from "./data.service"

export const DataMapper = {
    Equity: {
        toDomain: (equity: Instrument): Equity => {
            const token = equity.token as EquityToken
            const tradingsymbol = equity.tradingsymbol as EquityTradingsymbol
            const tickSize = equity.tickSize as EquityTickSize
            const instrumentType = equity.instrumentType as EquityInstrumentType
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
        toDomain: (derivative: Instrument): Derivative => {
            const token = derivative.token as DerivativeToken
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
            const tickSize = derivative.tickSize as DerivativeTickSize
            const stepSize = 0 // to be calculated while linking
            const lotSize = derivative.lotSize as DerivativeLotSize
            const instrumentType = derivative.instrumentType as DerivativeInstrumentType
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