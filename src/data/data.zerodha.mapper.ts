import { KiteConnect } from 'kiteconnect'
import { Instrument } from './data'
import {z} from 'zod'
import { Exchange, InstrumentType } from 'src/types/app/entities'

export const InstrumentMapper = {
  toDomain: (
    instrument: Awaited<ReturnType<KiteConnect['getInstruments']>>[number],
  ): Instrument => {
    try {
      return {
        token: parseInt(instrument.instrument_token),
        name: instrument.name,
        tradingsymbol: instrument.tradingsymbol,
        expiry: instrument.expiry ? new Date(instrument.expiry) : null,
        strike: instrument.strike,
        tickSize: instrument.tick_size,
        lotSize: instrument.lot_size,
        instrumentType: z.nativeEnum(InstrumentType).parse(instrument.instrument_type),
        exchange: z.nativeEnum(Exchange).parse(instrument.exchange),
        lastPrice: instrument.last_price,
      }
    } catch (error) {
      // Log the error and return a default or null value
      console.error('Error parsing instrument:', error, instrument);
      return null; // or use a default Instrument object if preferable
    }
  },
}