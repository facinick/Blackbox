import { Inject, Injectable } from '@nestjs/common'
import * as path from 'node:path'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import { Exchange, ExpiryMonth, InstrumentType } from 'src/types/app/entities'
import { fileExists, readJsonFromFile, writeJsonToFile } from 'src/utils'
import { Instrument } from './data'
@Injectable()
export class DataService {

  private lastUpdated: Date

  private static RAW_NSE_INSTRUMENTS_FILENAME: string
  private static RAW_NFO_INSTRUMENTS_FILENAME: string

  private static instruments: Instrument[] = new Array<Instrument>
  private static tokenIndex = new Map<number, Instrument>();

  constructor(
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
  ) { }

  // reinitialize on new day event
  initialize = async () => {

    if(this.lastUpdated && new Date().getDate() <= this.lastUpdated.getDate()) {
      console.log(`data service is already initialized for today`)
      return
    }

    console.log(`setting file names for today`)
    DataService.setFilenamesForToday()

    console.log(`load nse and nfo instruments`)
    await this.loadNseInstruments()
    await this.loadNfoInstruments()

    // temporary, delete this after development
    await DataService.saveTransformedDataForInspection()

    console.log(`generate indexes`)
    await DataService.generateIndexes()
    this.lastUpdated = new Date()
  }

  // temporary, delete this after development
  private static saveTransformedDataForInspection = async () => {
    await writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/instruments.json',
      JSON.stringify(DataService.instruments, null, 2),
    )
  }

  // assuming tick size is same across exchanges
  public static getTickSizeForTradingsymbol = (tradingSymbol: string) => {
    const instrument = DataService.instruments.filter((instrument) => instrument.tradingsymbol === tradingSymbol)
    return instrument[0].tickSize
  }

  loadNseInstruments = async () => {
    console.debug(`loading nse instruments...`)
    const rawFileExists = await fileExists(
      DataService.RAW_NSE_INSTRUMENTS_FILENAME,
    )

    if (rawFileExists) {
      console.debug(`found list of available nse instruments locally, about to read`)
      DataService.instruments.push(...await readJsonFromFile(
        DataService.RAW_NSE_INSTRUMENTS_FILENAME,
      ))
      console.debug(
        `read list of available nse instruments: ${DataService.instruments.length}`,
      )
    } else {
      // fetch
      console.debug(
        `couldn't find a list of available nse instruments locally, about to fetch from server`,
      )
      const rawNseInstruments = await this.apiService.getTradableEquities()
      // write
      console.debug(
        `fetched the list of available nse instruments, about to save it locally`,
      )
      await writeJsonToFile(
        DataService.RAW_NSE_INSTRUMENTS_FILENAME,
        rawNseInstruments,
      )
      console.debug(
        `saved list of available nse instruments`,
      )
      await this.loadNseInstruments()
    }
  }

  loadNfoInstruments = async () => {
    console.debug(`loading nfo instruments...`)
    const rawFileExists = await fileExists(
      DataService.RAW_NFO_INSTRUMENTS_FILENAME,
    )

    if (rawFileExists) {
      console.debug(`found list of available nfo instruments locally, about to read`)
      DataService.instruments.push(...await readJsonFromFile(
        DataService.RAW_NFO_INSTRUMENTS_FILENAME,
      ))
      console.debug(
        `read list of available nfo instruments: ${DataService.instruments.length}`,
      )
    } else {
      // fetch
      console.debug(
        `couldn't find a list of available nfo instruments locally, about to fetch from server`,
      )
      const rawNfoInstruments = await this.apiService.getTradableDerivatives()
      // write
      console.debug(
        `fetched the list of available nfo instruments, about to save it locally`,
      )
      await writeJsonToFile(
        DataService.RAW_NFO_INSTRUMENTS_FILENAME,
        rawNfoInstruments,
      )
      console.debug(
        `saved list of available nfo instruments`,
      )
      await this.loadNfoInstruments()
    }
  }

  static generateIndexes = () => {
    DataService.tokenIndex = new Map(DataService.instruments.map(instrument => [instrument.token, instrument]));
  }

  public static getInstrumentFromToken = (token: number) => {
    return DataService.tokenIndex.get(token)
  }

  public static getInstument = (token: number) => {
    return DataService.tokenIndex.get(token)
  }

  public static getInstruments = (filterOptions: {
    tradingsymbol?: string | string[];
    expiry?: Date;
    instrumentType?: InstrumentType | InstrumentType[];  // Allow single value or array
    exchange?: Exchange | Exchange[];  // Allow single value or array
  } = {}): Instrument[] => {
    const { tradingsymbol, expiry, instrumentType, exchange } = filterOptions;

    const filteredList = DataService.instruments.filter(instrument => {
  
      const matchTradingsymbol = Array.isArray(tradingsymbol)
        ? tradingsymbol.includes(instrument.tradingsymbol)
        : tradingsymbol
        ? instrument.tradingsymbol === tradingsymbol
        : true;

      const matchExpiry = expiry ? instrument.expiry === expiry : true;
  
      const matchInstrumentType = Array.isArray(instrumentType)
        ? instrumentType.includes(instrument.instrumentType)
        : instrumentType
        ? instrument.instrumentType === instrumentType
        : true;
  
      const matchExchange = Array.isArray(exchange)
        ? exchange.includes(instrument.exchange)
        : exchange
        ? instrument.exchange === exchange
        : true;

      return matchTradingsymbol && matchExpiry && matchInstrumentType && matchExchange;
    })

    return filteredList
  }

  private static setFilenamesForToday = () => {
    const today = new Date()
    const dateString = `${today.toLocaleString('default', { month: 'short' }).toLowerCase()}${today.getDate()}`

    DataService.RAW_NSE_INSTRUMENTS_FILENAME = path.join(
      process.cwd(),
      'instruments',
      `${dateString}_nse_instruments.json`,
    )

    DataService.RAW_NFO_INSTRUMENTS_FILENAME = path.join(
      process.cwd(),
      'instruments',
      `${dateString}_nfo_instruments.json`,
    )

    console.debug(
      `nse_instruments are stored in:`,
      DataService.RAW_NSE_INSTRUMENTS_FILENAME,
    )

    console.debug(
      `nfo_instruments are stored in:`,
      DataService.RAW_NFO_INSTRUMENTS_FILENAME,
    )
  }

  // static DERRIVATIVE_TRADING_SYMBOL_REGEX =
  //   /^([A-Z][A-Z]+)(\d{1,2})([A-Z]{3})(\d+(\.\d+)?)(PE|CE)$/

  // public static hasNPlusDaysToExpiry = (
  //   tradingSymbol: string,
  //   n: number,
  // ) => {
  //   const today = DataService.getToday()

  //   const derivativeData =
  //     DataService.derivativesTradingsymbolReferenceMap.get(tradingSymbol)

  //   if (!derivativeData) {
  //     throw new Error(`no derivative data found for: ${tradingSymbol}`)
  //   }

  //   const expiryDate = new Date(
  //     derivativeData.expiry.getFullYear(),
  //     derivativeData.expiry.getMonth(),
  //     derivativeData.expiry.getDate(),
  //   )

  //   const currentDate = new Date(
  //     today.year,
  //     today.month,
  //     today.date,
  //   )

  //   // Calculate difference in milliseconds between expiry date and current date
  //   const timeDiff = expiryDate.getTime() - currentDate.getTime()

  //   // Convert milliseconds to days
  //   const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

  //   return daysDiff >= n
  // }

  // public static getAvailableOTMCallOptionFor = (
  //   tradingsymbol: string,
  //   expiryMonth: ExpiryMonth,
  //   atmPrice: number,
  // ): Instrument | undefined => {
  //   const positions = DataService.getAvailableCallOptionsFor(
  //     tradingsymbol,
  //     expiryMonth,
  //   )

  //   for (const position of positions) {
  //     if (position.strike >= atmPrice) {
  //       return position
  //     }
  //   }
  // }

  // public static getAvailableCallOptionsFor = (
  //   tradingsymbol: string,
  //   expiryMonth: ExpiryMonth,
  // ): Instrument[] => {
  //   const callOptions: Array<Instrument> = []

  //   const calls =
  //     DataService.equitiesTradingSymbolReferenceMap.get(tradingsymbol).calls

  //   for (const callOptionToken of calls) {
  //     if (DataService.derivativesTokenReferenceMap.has(callOptionToken)) {
  //       const derivative =
  //         DataService.derivativesTokenReferenceMap.get(callOptionToken)

  //       if (derivative.expiryParsed.month === expiryMonth) {
  //         callOptions.push(
  //           DataService.derivativesTokenReferenceMap.get(callOptionToken),
  //         )
  //       }
  //     }
  //   }

  //   callOptions.sort((a, b) => {
  //     const expiryA = new Date(a.expiry).getTime()
  //     const expiryB = new Date(b.expiry).getTime()

  //     if (expiryA !== expiryB) {
  //       return expiryA - expiryB
  //     } else {
  //       return a.strike - b.strike
  //     }
  //   })

  //   return callOptions
  // }
}
