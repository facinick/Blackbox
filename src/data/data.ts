import { Exchange, ExpiryMonth, InstrumentType } from 'src/types/app/entities'
import { z } from 'zod'

type Instrument = {
  token: number
  name: string
  tradingsymbol: string
  expiry: Date | null
  strike: number
  tickSize: number
  lotSize: number
  lastPrice: number
  instrumentType: InstrumentType
  exchange: Exchange
}

const JSONInstrument = z.object({
  token: z.number(),
  name: z.string(),
  tradingsymbol: z.string(),
  expiry: z.string(), // Empty string or date string
  strike: z.number(),
  tickSize: z.number(),
  lotSize: z.number(),
  lastPrice: z.number(),
  instrumentType: z.string(),
  exchange: z.string(),
})

const Derivative = z.object({
  token: z.number(),
  name: z.string(),
  tradingsymbol: z.string(),
  tradingsymbolParsed: z.object({
    date: z.number(),
    month: z.enum([ExpiryMonth.JAN, ExpiryMonth.FEB, ExpiryMonth.MAR, ExpiryMonth.MAY, ExpiryMonth.JUN, ExpiryMonth.JUL, ExpiryMonth.AUG, ExpiryMonth.SEP, ExpiryMonth.APR, ExpiryMonth.OCT, ExpiryMonth.NOV, ExpiryMonth.DEC]),
    strike: z.number(),
    name: z.string(),
    instrumentType: z.enum([InstrumentType.CE, InstrumentType.FUT, InstrumentType.PE]),
  }),
  expiry: z.date(),
  expiryParsed: z.object({
    date: z.number(),
    month: z.enum([ExpiryMonth.JAN, ExpiryMonth.FEB, ExpiryMonth.MAR, ExpiryMonth.MAY, ExpiryMonth.JUN, ExpiryMonth.JUL, ExpiryMonth.AUG, ExpiryMonth.SEP, ExpiryMonth.APR, ExpiryMonth.OCT, ExpiryMonth.NOV, ExpiryMonth.DEC]),
    year: z.number(),
  }),
  strike: z.number(),
  tickSize: z.number(),
  lotSize: z.number(),
  instrumentType: z.enum([InstrumentType.CE, InstrumentType.FUT, InstrumentType.PE]),
  exchange: z.enum([Exchange.NFO, Exchange.BFO]),
})

const Equity = z.object({
  token: z.number(),
  name: z.string(),
  tradingsymbol: z.string(),
  tickSize: z.number(),
  instrumentType: z.enum([InstrumentType.EQ]),
  exchange: z.enum([Exchange.NSE, Exchange.BSE]),
  calls: z.array(z.number()),
  puts: z.array(z.number()),
})

export {
  Instrument,
  JSONInstrument,
  Equity,
  Derivative,
}
