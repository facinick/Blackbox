enum InstrumentType {
  CE = 'CE',
  PE = 'PE',
  EQ = 'EQ',
  FUT = 'FUT',
}
// enum Segment {
//   NFO_OPT = 'NFO-OPT',
//   NSE = 'NSE',
//   BFO_OPT = 'BFO-OPT',
//   BSE = 'BSE',
//   INDEX = 'INDEX'
// }
enum Exchange {
  NFO = 'NFO',
  NSE = 'NSE',
  BFO = 'BFO',
  BSE = 'BSE',
  CDS = 'CDS',
  BCD = 'BCD',
  MCX = 'MCX'
}
enum Product {
  NRML = 'NRML',
  CNC = 'CNC'
}
enum ExpiryMonth {
  JAN = 'JAN',
  FEB = 'FEB',
  MAR = 'MAR',
  APR = 'APR',
  MAY = 'MAY',
  JUN = 'JUN',
  JUL = 'JUL',
  AUG = 'AUG',
  SEP = 'SEP',
  OCT = 'OCT',
  NOV = 'NOV',
  DEC = 'DEC',
}
enum BuyOrSell {
  BUY = 'BUY',
  SELL = 'SELL'
}

export {
  InstrumentType,
  Exchange,
  Product,
  ExpiryMonth,
  BuyOrSell,
}