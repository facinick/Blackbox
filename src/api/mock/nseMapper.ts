import { ZTick } from 'src/types/thirdparty/tick'

export type NseHistoricalData = {
  Symbol: string
  Date: string
  Expiry: string
  'Option type': string
  'Strike Price': string
  Open: string
  High: string
  Low: string
  Close: string
  LTP: string
  'Open Int': string
}

const toISODateString = (dateStr) => {
  const [day, month, year] = dateStr.split('-')
  const monthNum = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ].indexOf(month)
  return new Date(year, monthNum, day, 15, 30).toISOString()
}

export const NseMapper = (
  data: NseHistoricalData,
  token: number,
): ZTick & { date: string } => {
  return {
    instrument_token: token,
    last_price: parseInt(data.Close),
    date: toISODateString(data.Date),
  }
}
