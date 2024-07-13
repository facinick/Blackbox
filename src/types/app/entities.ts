type StrikePrice = number;
type InstrumentType = 'CE' | 'PE' | 'EQ';
type Segment = 'NFO_OPT' | 'NSE' | 'BFO_OPT' | 'BSE';
type Exchange = 'NFO' | 'NSE' | 'BFO' | 'BSE'
type Product = 'NRML' | 'CNC';
type ExpiryMonth =
  | 'JAN'
  | 'FEB'
  | 'MAR'
  | 'APR'
  | 'MAY'
  | 'JUN'
  | 'JUL'
  | 'AUG'
  | 'SEP'
  | 'OCT'
  | 'NOV'
  | 'DEC';
type ExpiryYear = number;
type ExpiryDate = number;
type BuyOrSell = 'BUY' | 'SELL';

// Equities
type EquityName = string;
type EquityInstrumentType = Extract<InstrumentType, 'EQ'>;
type EquityTradingsymbol = string;
type EquityToken = number;
type EquityTickSize = number;
type EquitySegment = Extract<Segment, 'NSE'>;
type EquityExchange = Extract<Exchange, 'NSE'>;

// Derivatives
type DerivativeName = string;
type DerivativeInstrumentType = Extract<InstrumentType, 'CE' | 'PE'>;
type DerivativeTradingsymbol =
  `${DerivativeName}${ExpiryDate}${ExpiryMonth}${StrikePrice}${DerivativeInstrumentType}`;
type DerivativeTradingsymbolParsed = {
  date: ExpiryDate;
  month: ExpiryMonth;
  strike: StrikePrice;
  name: DerivativeName;
  instrumentType: DerivativeInstrumentType;
};
type DerivativeToken = number;
type DerivativeExpiry = string;
type DerivativeExpiryParsed = {
  date: ExpiryDate;
  month: ExpiryMonth;
  year: ExpiryYear;
};
type DerivativeLotSize = number;
type DerivativeTickSize = number;
type DerivativeStepSize = number;
type DerivativeSegment = Extract<Segment, 'NFO_OPT'>;
type DerivativeExchange = Extract<Exchange, 'NFO'>;

type Tradingsymbol = EquityTradingsymbol | DerivativeTradingsymbol;
type Token = EquityToken | DerivativeToken;
