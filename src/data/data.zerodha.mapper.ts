import { KiteConnect } from 'kiteconnect';
import { Instrument } from './data';

export const InstrumentMapper = {
  toDomain: (
    instrument: Awaited<ReturnType<KiteConnect['getInstruments']>>[number],
  ): Instrument => {
    return {
      token: parseInt(instrument.instrument_token),
      name: instrument.name,
      tradingsymbol: instrument.tradingsymbol,
      expiry: String(instrument.expiry),
      strike: instrument.strike,
      tickSize: instrument.tick_size,
      lotSize: instrument.lot_size,
      stepSize: 0,
      instrumentType: instrument.instrument_type as InstrumentType,
      segment: instrument.segment as Segment,
      exchange: instrument.exchange,
    };
  },
};
