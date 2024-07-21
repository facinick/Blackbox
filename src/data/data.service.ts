import { Inject, Injectable } from '@nestjs/common'
import { promises as fs } from 'fs'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import {
  derivativeNameExists,
  equityTradingsymbolExists,
  getEquityTradingsymbolByDerivativeName,
} from './eq_de_map'
import * as path from 'node:path'
import { DataMapper } from './data.local-json.mapper'
import { Derivative, Equity, Instrument } from './data'

@Injectable()
export class DataService {
  private static RAW_EQUITIES_FILENAME: string
  private static RAW_DERIVATIVES_FILENAME: string

  private static readonly equitiesTokenReferenceMap = new Map<
    EquityToken,
    Equity
  >()
  private static readonly equitiesTradingSymbolReferenceStepSizeMap = new Map<
    EquityTradingsymbol,
    number
  >()
  private static readonly equitiesTradingSymbolReferenceMap = new Map<
    EquityTradingsymbol,
    Equity
  >()

  private static readonly derivativesTokenReferenceMap = new Map<
    DerivativeToken,
    Derivative
  >()
  private static readonly derivativesTradingsymbolReferenceMap = new Map<
    DerivativeTradingsymbol,
    Derivative
  >()

  private static readonly expiries: Array<DerivativeExpiryParsed> = []

  constructor(
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
  ) {}

  initialize = async () => {
    console.log(`setting file names for today`)
    DataService.setFilenamesForToday()

    // remove this ************
    // this.RAW_EQUITIES_FILENAME =
    //   '/Users/facinick/Repositories/blackbox/src/data/jul5_raw_equities.json';
    // this.RAW_DERIVATIVES_FILENAME =
    //   '/Users/facinick/Repositories/blackbox/src/data/jul5_raw_derivatives.json';
    // ************************

    console.log(`load derivatives`)
    await this.loadDerivatives()
    console.log(`load equities`)
    await this.loadEquities()
    console.log(`generate calls, puts, step size and expiries.`)
    DataService.linkDerivatives()
    DataService.calculateStepSizeFromCallsAndUpdateDerivatives()

    console.log(`finished initializing`)
    // temporary, delete this after development
    await DataService.saveTransformedDataForInspection()
  }

  // temporary, delete this after development
  private static saveTransformedDataForInspection = async () => {
    await DataService.writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/equity_token_to_equity.json',
      Object.fromEntries(DataService.equitiesTokenReferenceMap),
    )

    await DataService.writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/equity_symbol_to_equity.json',
      Object.fromEntries(DataService.equitiesTradingSymbolReferenceMap),
    )

    await DataService.writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/derivative_token_to_derivative.json',
      Object.fromEntries(DataService.derivativesTokenReferenceMap),
    )

    await DataService.writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/derivative_symbol_to_derivative.json',
      Object.fromEntries(DataService.derivativesTradingsymbolReferenceMap),
    )
  }

  public static getTickSizeForTradingsymbol = (
    tradingSymbol: Tradingsymbol,
  ) => {
    if (DataService.equitiesTradingSymbolReferenceMap.has(tradingSymbol)) {
      return DataService.equitiesTradingSymbolReferenceMap.get(tradingSymbol)
        .tickSize
    } else if (
      DataService.derivativesTradingsymbolReferenceMap.has(
        tradingSymbol as DerivativeTradingsymbol,
      )
    ) {
      return DataService.derivativesTradingsymbolReferenceMap.get(
        tradingSymbol as DerivativeTradingsymbol,
      ).tickSize
    } else {
      throw new Error(
        `trading symbol you're dealing with isnt in the database buddy`,
      )
    }
  }

  /*
    Only the derivatives and equities information tat exist in our db will be handled by our application
  */
  public static hasDerivativeInfo = (
    tradingSymbol: DerivativeTradingsymbol,
  ) => {
    return DataService.derivativesTradingsymbolReferenceMap.has(tradingSymbol)
  }

  public static hasEquityInfo = (tradingSymbol: EquityTradingsymbol) => {
    return DataService.equitiesTradingSymbolReferenceMap.has(tradingSymbol)
  }

  private loadDerivatives = async () => {
    console.debug(`loading derivatives...`)
    const rawFileExists = await DataService.fileExists(
      DataService.RAW_DERIVATIVES_FILENAME,
    )

    if (rawFileExists) {
      console.debug(`found list of available derivates locally, about to read`)
      const rawDerivatives: Instrument[] = await DataService.readJsonFromFile(
        DataService.RAW_DERIVATIVES_FILENAME,
      )
      // transform and process
      console.debug(
        `read list of available derivates, about to process and transform`,
      )
      DataService.processDerivatives(rawDerivatives)
    } else {
      // fetch
      console.debug(
        `couldn't find a list of available derivates locally, about to fetch from server`,
      )
      const rawDerivatives = await this.apiService.getTradableDerivatives()
      // write
      console.debug(
        `fetched the list of available derivates, about to save it locally`,
      )
      await DataService.writeJsonToFile(
        DataService.RAW_DERIVATIVES_FILENAME,
        rawDerivatives,
      )
      // load
      return this.loadDerivatives()
    }
  }

  public static getEquityInfoFromToken = (equityToken: EquityToken) => {
    return DataService.equitiesTokenReferenceMap.get(equityToken)
  }

  public static getEquityInfoFromTradingsymbol = (
    tradingsymbol: EquityTradingsymbol,
  ) => {
    return DataService.equitiesTradingSymbolReferenceMap.get(tradingsymbol)
  }

  public static getDerivativeInfoFromToken = (
    derivativeToken: DerivativeToken,
  ) => {
    return DataService.derivativesTokenReferenceMap.get(derivativeToken)
  }

  public static getDerivativeInfoFromTradingSymbol = (
    tradingSymbol: DerivativeTradingsymbol,
  ) => {
    for (const [key, value] of DataService.derivativesTokenReferenceMap) {
      if (value.tradingsymbol === tradingSymbol) {
        return value
      }
    }

    throw new Error(`unexpected: cannot find derivative for the given symbol`)
  }

  public static getDerivativeExpiryInfoFromDerivativeToken(
    derivativeToken: DerivativeToken,
  ) {
    return DataService.derivativesTokenReferenceMap.get(derivativeToken).expiry
  }

  public static getNStrikesUpFromDerivativeToken = (
    derivativeToken: DerivativeToken,
    n = 1,
  ) => {
    const derivativeInfo =
      DataService.derivativesTokenReferenceMap.get(derivativeToken)

    // const currentStrike = derivativeInfo.strike

    const nStrikesNext = derivativeInfo.strike + derivativeInfo.stepSize * 1

    return nStrikesNext
  }

  private loadEquities = async () => {
    console.debug(`loading equities...`)
    const rawFileExists = await DataService.fileExists(
      DataService.RAW_EQUITIES_FILENAME,
    )

    if (rawFileExists) {
      // read
      console.debug(`found list of available equities locally, about to read`)
      const rawEquities: Instrument[] = await DataService.readJsonFromFile(
        DataService.RAW_EQUITIES_FILENAME,
      )
      // transform and process
      console.debug(
        `read list of available equities, about to process and transform`,
      )
      DataService.processEquities(rawEquities)
    } else {
      // fetch
      console.debug(
        `couldn't find a list of available equities locally, about to fetch from server`,
      )
      const rawEquities = await this.apiService.getTradableEquities()
      // write
      console.debug(
        `fetched the list of available equities, about to save it locally`,
      )
      await DataService.writeJsonToFile(
        DataService.RAW_EQUITIES_FILENAME,
        rawEquities,
      )
      // load
      return this.loadEquities()
    }
  }

  private static processDerivatives = (rawDerivatives: Instrument[]) => {
    const uniqueExpiries: Set<string> = new Set()
    rawDerivatives.forEach((rawDerivative) => {
      // redundant check, until we have value objects that can validate in themselves

      // todo: remove this, but also extend app logic to work with multiple exchanges
      if (
        rawDerivative.exchange !== 'NFO' ||
        rawDerivative.segment !== 'NFO-OPT' ||
        !['CE', 'PE'].includes(rawDerivative.instrumentType)
      ) {
        return
      }

      if (!derivativeNameExists(rawDerivative.name)) {
        return
      }

      const tokenKey = rawDerivative.token

      const tradingSymbolKey =
        rawDerivative.tradingsymbol as DerivativeTradingsymbol

      const value = DataMapper.Derivative.toDomain(rawDerivative)

      // passing same object reference, to access data using both token and symbol
      DataService.derivativesTokenReferenceMap.set(tokenKey, value)
      DataService.derivativesTradingsymbolReferenceMap.set(
        tradingSymbolKey,
        value,
      )

      // Populate the uniqueExpiries set
      const expiryDate = new Date(rawDerivative.expiry)
      uniqueExpiries.add(expiryDate.toISOString())
    })

    DataService.processExpiries(uniqueExpiries)
  }

  private static processExpiries = (uniqueExpiries: Set<string>) => {
    uniqueExpiries.forEach((expiryString) => {
      const expiryDate = new Date(expiryString)

      DataService.expiries.push({
        date: expiryDate.getDate(),
        month: DataService.getMonthAbbreviation(expiryDate.getMonth()),
        year: expiryDate.getFullYear(),
      })
    })

    // Sort the expiries array in ascending order
    DataService.expiries.sort((a, b) => {
      const dateA = new Date(a.year, DataService.getMonthIndex(a.month), a.date)
      const dateB = new Date(b.year, DataService.getMonthIndex(b.month), b.date)
      return dateA.getTime() - dateB.getTime()
    })
  }

  private static linkDerivatives = () => {
    for (const [key, value] of DataService.derivativesTokenReferenceMap) {
      const derivativeName = value.name

      const correspondingEquityTradingsymbol =
        getEquityTradingsymbolByDerivativeName(derivativeName)

      if (value.instrumentType === 'CE') {
        // gets reference to calls array.
        const calls = DataService.equitiesTradingSymbolReferenceMap.get(
          correspondingEquityTradingsymbol,
        ).calls

        calls.push(key)
      } else if (value.instrumentType === 'PE') {
        // gets reference to puts array.
        const puts = DataService.equitiesTradingSymbolReferenceMap.get(
          correspondingEquityTradingsymbol,
        ).puts

        puts.push(key)
      }
      // todo: remove this check later, its only to catch bugs right now.
      else {
        throw new Error(`unexpected instrument type: ${value.instrumentType}`)
      }
    }
  }

  private static calculateStepSizeFromCallsAndUpdateDerivatives = () => {
    for (const [key, value] of DataService.equitiesTradingSymbolReferenceMap) {
      const calls = value.calls
      let stepSize

      if (calls.length >= 2) {
        const firstCall = DataService.getDerivativeInfoFromToken(calls[0])

        const secondCall = DataService.getDerivativeInfoFromToken(calls[1])

        // todo: verify if this is always correct. the calls are not sorted as per increasing strike
        // so we can ensure we always get correct step size by abs(a-b)?
        stepSize = Math.abs(secondCall.strike - firstCall.strike)

        DataService.equitiesTradingSymbolReferenceStepSizeMap.set(key, stepSize)
      } else {
        throw new Error(`Cannot calculate step size, not enough information.`)
      }
    }

    for (const [key, value] of DataService.derivativesTokenReferenceMap) {
      const equityTradingSymbol = getEquityTradingsymbolByDerivativeName(
        value.name,
      )

      value.stepSize =
        DataService.equitiesTradingSymbolReferenceStepSizeMap.get(
          equityTradingSymbol,
        )
    }
  }

  private static processEquities = (rawEquities: Instrument[]) => {
    rawEquities.forEach((rawEquity) => {
      // redundant check
      if (
        rawEquity.exchange !== 'NSE' ||
        rawEquity.segment !== 'NSE' ||
        rawEquity.instrumentType !== 'EQ'
      ) {
        return
      }

      if (!equityTradingsymbolExists(rawEquity.tradingsymbol)) {
        return
      }

      const tokenKey = rawEquity.token

      const tradingSymbolKey = rawEquity.tradingsymbol

      const value = DataMapper.Equity.toDomain(rawEquity)

      DataService.equitiesTokenReferenceMap.set(tokenKey, value)

      DataService.equitiesTradingSymbolReferenceMap.set(tradingSymbolKey, value)
    })
  }

  // public static getInstrumentInfoFromToken = (instrumentToken: Token): Equity | Derivative => {
  //   if(DataService.derivativesTokenReferenceMap.has(instrumentToken)) {
  //     return DataService.derivativesTokenReferenceMap.get(instrumentToken)
  //   }

  //   else if(DataService.equitiesTokenReferenceMap.has(instrumentToken)) {
  //     return DataService.equitiesTokenReferenceMap.get(instrumentToken)
  //   }

  //   else {
  //     throw new Error(`requested token doesn't exist,: ${instrumentToken}`,)
  //   }
  // }

  // public static getInstrumentInfoFromTradingsymbol = (tradingymbol: Tradingsymbol): Equity | Derivative => {

  //   //@ts-expect-error tradingymbol could be derivativeTradingSymbol
  //   if(DataService.derivativesTradingsymbolReferenceMap.has(tradingymbol)) {
  //         //@ts-expect-error tradingymbol could be derivativeTradingSymbol
  //     return DataService.derivativesTradingsymbolReferenceMap.get(tradingymbol)
  //   }

  //   else if(DataService.equitiesTradingSymbolReferenceMap.has(tradingymbol)) {
  //     return DataService.equitiesTradingSymbolReferenceMap.get(tradingymbol)
  //   }

  //   else {
  //     throw new Error(`requested tradingsymbol doesn't exist: ${tradingymbol}`)
  //   }
  // }

  private static setFilenamesForToday = () => {
    const today = new Date()
    const dateString = `${today.toLocaleString('default', { month: 'short' }).toLowerCase()}${today.getDate()}`

    DataService.RAW_DERIVATIVES_FILENAME = path.join(
      process.cwd(),
      'instruments',
      `${dateString}_raw_derivatives.json`,
    )
    DataService.RAW_EQUITIES_FILENAME = path.join(
      process.cwd(),
      'instruments',
      `${dateString}_raw_equities.json`,
    )
    console.debug(
      `derivatives are stored in:`,
      DataService.RAW_DERIVATIVES_FILENAME,
    )
    console.debug(`equities are stored in:`, DataService.RAW_EQUITIES_FILENAME)
  }

  static DERRIVATIVE_TRADING_SYMBOL_REGEX =
    /^([A-Z][A-Z]+)(\d{1,2})([A-Z]{3})(\d+(\.\d+)?)(PE|CE)$/

  static parseDerivativeTradingSymbol = (
    derivativeTradingSymbol: DerivativeTradingsymbol,
  ): DerivativeTradingsymbolParsed => {
    const match = derivativeTradingSymbol.match(
      DataService.DERRIVATIVE_TRADING_SYMBOL_REGEX,
    )

    if (!match) {
      throw new Error(
        `Invalid trading symbol format: ${derivativeTradingSymbol}`,
      )
    }

    // [
    //   'ASIANPAINT24JUL3100PE',
    //   'ASIANPAINT',
    //   '24',
    //   'JUL',
    //   '3100',
    //   undefined,
    //   'PE',
    //   index: 0,
    //   input: 'ASIANPAINT24JUL3100PE',
    //   groups: undefined
    // ]

    /*
      returns [ASIANPAINT23AUG2500CE, ASIANPAINT, 23, AUG, 2500, junk ,CE]
    */
    const [, name, date, month, strike, junk, instrumentType] = match

    return {
      name,
      date: parseInt(date),
      month: month as DerivativeExpiryParsed['month'],
      strike: parseInt(strike),
      instrumentType:
        instrumentType as DerivativeTradingsymbolParsed['instrumentType'],
    }
  }

  static parseExpiry = (expiry: string): DerivativeExpiryParsed => {
    const date = new Date(expiry)
    const month = date
      .toLocaleString('default', { month: 'short' })
      .toUpperCase() as ExpiryMonth
    const _date = date.getDate()
    const year = date.getFullYear()
    return { date: _date, month, year }
  }

  static writeJsonToFile = async (
    filePath: string,
    data: any,
  ): Promise<void> => {
    const jsonData = JSON.stringify(data, null, 2)
    await fs.writeFile(filePath, jsonData, 'utf8')
  }

  static readJsonFromFile = async (filePath: string): Promise<any> => {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  }

  static fileExists = async (filePath: string): Promise<boolean> => {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  static isCallOption = (tradingSymbol: DerivativeTradingsymbol) => {
    try {
      const parsedTradingsymbol =
        DataService.parseDerivativeTradingSymbol(tradingSymbol)
      if (parsedTradingsymbol.instrumentType === 'CE') {
        return true
      }
    } catch (error) {
      return false
    }

    return false
  }

  static isDerivative = (
    tradingSymbol: EquityTradingsymbol | DerivativeTradingsymbol,
  ) => {
    try {
      const parsedTradingsymbol = DataService.parseDerivativeTradingSymbol(
        tradingSymbol as DerivativeTradingsymbol,
      )
      if (
        parsedTradingsymbol.instrumentType === 'CE' ||
        parsedTradingsymbol.instrumentType === 'PE'
      ) {
        return true
      }
    } catch (error) {
      return false
    }

    return false
  }

  public static isExpiringInMonth = (
    tradingSymbol: DerivativeTradingsymbol,
    month: ExpiryMonth,
  ) => {
    const derivativeInfo =
      DataService.derivativesTradingsymbolReferenceMap.get(tradingSymbol)

    return (
      derivativeInfo.expiryParsed.month.toLocaleLowerCase() ===
      month.toLocaleLowerCase()
    )
  }

  public static hasNPlusDaysToExpiry = (
    tradingSymbol: DerivativeTradingsymbol,
    n: number,
  ) => {
    const today = DataService.getToday()

    const derivativeData =
      DataService.derivativesTradingsymbolReferenceMap.get(tradingSymbol)

    if (!derivativeData) {
      throw new Error(`no derivative data found for: ${tradingSymbol}`)
    }

    const expiryDate = new Date(
      derivativeData.expiryParsed.year,
      DataService.getMonthIndex(derivativeData.expiryParsed.month),
      derivativeData.expiryParsed.date,
    )

    const currentDate = new Date(
      today.year,
      DataService.getMonthIndex(today.month),
      today.date,
    )

    // Calculate difference in milliseconds between expiry date and current date
    const timeDiff = expiryDate.getTime() - currentDate.getTime()

    // Convert milliseconds to days
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

    return daysDiff >= n
  }

  public static isPutOption = (tradingSymbol: DerivativeTradingsymbol) => {
    try {
      const parsedTradingsymbol =
        DataService.parseDerivativeTradingSymbol(tradingSymbol)
      if (parsedTradingsymbol.instrumentType === 'PE') {
        return true
      }
    } catch (error) {
      return false
    }

    return false
  }

  public static getToday = (): {
    date: ExpiryDate
    month: ExpiryMonth
    year: ExpiryYear
  } => {
    const now = new Date()

    return {
      date: now.getDate(),
      month: DataService.getMonthAbbreviation(now.getMonth()),
      year: now.getFullYear(),
    }
  }

  public static getMonthIndex = (month: ExpiryMonth): number => {
    // Function to map ExpiryMonth to month index (0 for JAN, 1 for FEB, etc.)
    const monthIndexMap: Record<ExpiryMonth, number> = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    }
    return monthIndexMap[month]
  }

  public static getMonthAbbreviation = (monthIndex: number): ExpiryMonth => {
    const date = new Date(2000, monthIndex, 1)
    const options = { month: 'short' } as const
    return date.toLocaleString('en-US', options).toUpperCase() as ExpiryMonth
  }

  public static getNearestExpiry = () => {
    return DataService.expiries.at(0)
  }

  public static getNearestExpiryForMonth = (
    month: ExpiryMonth,
  ): DerivativeExpiryParsed | null => {
    for (const expiry of DataService.expiries) {
      if (expiry.month === month) {
        return expiry
      }
    }
  }

  public static getAvailableOTMCallOptionFor = (
    tradingsymbol: EquityTradingsymbol,
    expiryMonth: ExpiryMonth,
    atmPrice: number,
  ): Derivative | undefined => {
    const positions = DataService.getAvailableCallOptionsFor(
      tradingsymbol,
      expiryMonth,
    )

    for (const position of positions) {
      if (position.strike >= atmPrice) {
        return position
      }
    }
  }

  public static getAvailableCallOptionsFor = (
    tradingsymbol: EquityTradingsymbol,
    expiryMonth: ExpiryMonth,
  ): Derivative[] => {
    const callOptions: Array<Derivative> = []

    const calls =
      DataService.equitiesTradingSymbolReferenceMap.get(tradingsymbol).calls

    for (const callOptionToken of calls) {
      if (DataService.derivativesTokenReferenceMap.has(callOptionToken)) {
        const derivative =
          DataService.derivativesTokenReferenceMap.get(callOptionToken)

        if (derivative.expiryParsed.month === expiryMonth) {
          callOptions.push(
            DataService.derivativesTokenReferenceMap.get(callOptionToken),
          )
        }
      }
    }

    callOptions.sort((a, b) => {
      const expiryA = new Date(a.expiry).getTime()
      const expiryB = new Date(b.expiry).getTime()

      if (expiryA !== expiryB) {
        return expiryA - expiryB
      } else {
        return a.strike - b.strike
      }
    })

    return callOptions
  }
}
