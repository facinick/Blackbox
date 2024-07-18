export type Instrument = {
  token: DerivativeToken | EquityToken;
  name: DerivativeName | EquityName;
  tradingsymbol: DerivativeTradingsymbol | EquityTradingsymbol;
  expiry: string;
  strike: StrikePrice;
  tickSize: DerivativeTickSize | EquityTickSize;
  lotSize: number;
  stepSize: number;
  instrumentType: InstrumentType;
  segment: Segment;
  exchange: Exchange;
};

export type Derivative = {
  token: DerivativeToken;
  name: DerivativeName;
  tradingsymbol: DerivativeTradingsymbol;
  tradingsymbolParsed: DerivativeTradingsymbolParsed;
  expiry: string;
  expiryParsed: DerivativeExpiryParsed;
  strike: StrikePrice;
  tickSize: DerivativeTickSize;
  lotSize: number;
  stepSize: number;
  instrumentType: DerivativeInstrumentType;
  segment: DerivativeSegment;
  exchange: DerivativeExchange;
};

export type Equity = {
  token: EquityToken;
  tradingsymbol: EquityTradingsymbol;
  tickSize: EquityTickSize;
  instrumentType: EquityInstrumentType;
  segment: EquitySegment;
  exchange: EquityExchange;
  calls: DerivativeToken[];
  puts: DerivativeToken[];
};
