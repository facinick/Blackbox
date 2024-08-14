import { z } from 'zod'
import { Derivative, Equity, Instrument, JSONInstrument } from './data'

export const DataMapper = {
  Equity: {
    toDomain: (equity: Instrument): z.infer<typeof Equity> => {
      const token = equity.token
      const tradingsymbol = equity.tradingsymbol
      const tickSize = equity.tickSize
      const instrumentType = equity.instrumentType
      const exchange = equity.exchange

      return (
        Equity.parse({
          token,
          tradingsymbol,
          tickSize,
          instrumentType,
          exchange,
          calls: [],
          puts: [],
        })
      )
    },
  },
  Derivative: {
    toDomain: (instrument: Instrument): z.infer<typeof Derivative> => {
      const token = instrument.token
      const name = instrument.name
      const tradingsymbol = instrument.tradingsymbol
      const expiry = new Date(instrument.expiry)
      const strike = instrument.strike
      const tickSize = instrument.tickSize
      const lotSize = instrument.lotSize
      const instrumentType =
        instrument.instrumentType
      const exchange = instrument.exchange

      return (Derivative.parse({
        token,
        name,
        tradingsymbol,
        expiry,
        strike,
        tickSize,
        lotSize,
        instrumentType,
        exchange,
      }))
    },
  },
  Instrument: {
    fromJson: (instrument: z.infer<typeof JSONInstrument>): Instrument => {
      const token = instrument.token
      const name = instrument.name
      const tradingsymbol = instrument.tradingsymbol
      const expiry = instrument.expiry ? new Date(instrument.expiry) : null
      const strike = instrument.strike
      const tickSize = instrument.tickSize
      const lotSize = instrument.lotSize
      const instrumentType = instrument.instrumentType as any // Assuming correct type from enum values
      const exchange = instrument.exchange as any // Assuming correct type from enum values
      const lastPrice = instrument.lastPrice

      return ({
        token,
        name,
        tradingsymbol,
        expiry,
        strike,
        tickSize,
        lotSize,
        instrumentType,
        exchange,
        lastPrice
      })
    },

    toJSON: (instrument: Instrument): z.infer<typeof JSONInstrument> => {
      return JSONInstrument.parse({
        ...instrument,
        expiry: instrument.expiry ? instrument.expiry.toISOString() : null
      })
    }
  }
}