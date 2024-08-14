import { Instrument } from 'src/data/data'
import { Balance } from 'src/portfolio/balances/Balances'
import { Holding } from 'src/portfolio/holdings/holdings'
import { Position } from 'src/portfolio/positions/Positions'
import { Exchange, InstrumentType, Product } from 'src/types/app/entities'

export const holdings: Holding[] = [
  {
    tradingsymbol: 'ITC',
    token: 424961,
    quantity: 500,
    averagePrice: 430,
  },
]

export const balance: Balance = {
  openingBalance: 1_000_000,
  cash: 1_000_000,
}

export const netPositions: Position[] = [
  {
    tradingsymbol: 'ITC24JUL430CE',
    token: 30844674,
    quantity: -1600,
    averagePrice: 10,
    exchange: Exchange.NFO,
    product: Product.NRML,
    lastPrice: 10
  },
]

// 430 to 490
export const instruments: Instrument[] = [
  {
    token: 424961,
    name: 'ITC',
    tradingsymbol: 'ITC',
    expiry: null,
    strike: 0,
    tickSize: 0.05,
    lotSize: 1,
    instrumentType: InstrumentType.EQ,
    exchange: Exchange.NSE,
    lastPrice: 0,
  },
  {
    token: 30844674,
    name: 'ITC',
    tradingsymbol: 'ITC24JUL430CE',
    expiry: new Date('2024-07-25T00:00:00.000Z'),
    strike: 430,
    tickSize: 0.05,
    lotSize: 1600, 
    instrumentType: InstrumentType.CE,
    exchange: Exchange.NFO
    , lastPrice: 0,
  },
  {
    token: 30845698,
    name: 'ITC',
    tradingsymbol: 'ITC24JUL440CE',
    expiry: new Date('2024-07-25T00:00:00.000Z'),
    strike: 440,
    tickSize: 0.05,
    lotSize: 1600, 
    instrumentType: InstrumentType.CE,
    exchange: Exchange.NFO,
    lastPrice: 0,
  },
  {
    token: 30853378,
    name: 'ITC',
    tradingsymbol: 'ITC24JUL450CE',
    expiry: new Date('2024-07-25T00:00:00.000Z'),
    strike: 450,
    tickSize: 0.05,
    lotSize: 1600, 
    instrumentType: InstrumentType.CE,
    exchange: Exchange.NFO,
    lastPrice: 0,
  },
  {
    token: 30878210,
    name: 'ITC',
    tradingsymbol: 'ITC24JUL460CE',
    expiry: new Date('2024-07-25T00:00:00.000Z'),
    strike: 460,
    tickSize: 0.05,
    lotSize: 1600, 
    instrumentType: InstrumentType.CE,
    exchange: Exchange.NFO,
    lastPrice: 0,
  },
  {
    token: 30879234,
    name: 'ITC',
    tradingsymbol: 'ITC24JUL470CE',
    expiry: new Date('2024-07-25T00:00:00.000Z'),
    strike: 470,
    tickSize: 0.05,
    lotSize: 1600, instrumentType: InstrumentType.CE,
    exchange: Exchange.NFO,
    lastPrice: 0,
  },
  {
    token: 30880258,
    name: 'ITC',
    tradingsymbol: 'ITC24JUL480CE',
    expiry: new Date('2024-07-25T00:00:00.000Z'),
    strike: 480,
    tickSize: 0.05,
    lotSize: 1600, 
    instrumentType: InstrumentType.CE,
    exchange: Exchange.NFO,
    lastPrice: 0,
  },
  {
    token: 30881282,
    name: 'ITC',
    tradingsymbol: 'ITC24JUL490CE',
    expiry: new Date('2024-07-25T00:00:00.000Z'),
    strike: 490,
    tickSize: 0.05,
    lotSize: 1600, 
    instrumentType: InstrumentType.CE,
    exchange: Exchange.NFO,
    lastPrice: 0,
  },
]
