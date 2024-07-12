import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { ApiService } from 'src/api/api.service';
import {
  derivativeNameExists,
  equityTradingsymbolExists,
  getEquityTradingsymbolByDerivativeName,
} from './eq_de_map';
import * as path from 'node:path';

type RawDerviative = {
  instrument_token: string; // "16168450",
  // "exchange_token": number, // "63158",
  tradingsymbol: string; // "ASIANPAINT21SEP2150CE",
  name: string; // "ASIANPAINT", <------------------
  // "last_price": number, // 0,
  expiry: string; // "2021-09-30T00:00:00.000Z",
  strike: number; // 2150,
  tick_size: number; // 0.05,
  lot_size: number; // 300,
  instrument_type: string; // "CE",
  segment: string; // "NFO-OPT",
  exchange: string; // "NFO"
};

type RawEquity = {
  instrument_token: string; // "60417",
  // "exchange_token": string, // "236",
  tradingsymbol: string; // "ASIANPAINT", <------------------
  name: string; // "ASIAN PAINTS",
  // "last_price": number, // 0,
  // "expiry": string, // "",
  // "strike": number, // 0,
  tick_size: number; // 0.05,
  // "lot_size": number, // 1,
  instrument_type: string; // "EQ",
  segment: string; //"BSE",
  exchange: string; //"BSE"
};

export type MappedDerivative = {
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

export type MappedEquity = {
  token: EquityToken;
  tradingsymbol: EquityTradingsymbol;
  tickSize: EquityTickSize;
  instrumentType: EquityInstrumentType;
  segment: EquitySegment;
  exchange: EquityExchange;
  calls: DerivativeToken[];
  puts: DerivativeToken[];
};

@Injectable()
export class DataService {
  private RAW_EQUITIES_FILENAME: string;
  private RAW_DERIVATIVES_FILENAME: string;

  private readonly equitiesTokenReferenceMap = new Map<
    EquityToken,
    MappedEquity
  >();
  private readonly equitiesTradingSymbolReferenceStepSizeMap = new Map<
    EquityTradingsymbol,
    number
  >();
  private readonly equitiesTradingSymbolReferenceMap = new Map<
    EquityTradingsymbol,
    MappedEquity
  >();

  private readonly derivativesTokenReferenceMap = new Map<
    DerivativeToken,
    MappedDerivative
  >();
  private readonly derivativesTradingsymbolReferenceMap = new Map<
    DerivativeTradingsymbol,
    MappedDerivative
  >();

  private expiries: Array<DerivativeExpiryParsed> = [];

  constructor(private readonly apiService: ApiService) {}

  initialize = async () => {
    this.setFilenamesForToday();

    // remove this ************
    // this.RAW_EQUITIES_FILENAME =
    //   '/Users/facinick/Repositories/blackbox/src/data/jul5_raw_equities.json';
    // this.RAW_DERIVATIVES_FILENAME =
    //   '/Users/facinick/Repositories/blackbox/src/data/jul5_raw_derivatives.json';
    // ************************

    await this.loadDerivatives();
    await this.loadEquities();
    this.linkDerivatives();
    this.calculateStepSizeFromCallsAndUpdateDerivatives();

    // temporary, delete this after development
    this.saveTransformedDataForInspection();
  }

  // temporary, delete this after development
  private saveTransformedDataForInspection = async () => {
    await DataService.writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/jul5_token_memory_equities.json',
      Object.fromEntries(this.equitiesTokenReferenceMap),
    );

    await DataService.writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/jul5_tradingsymbol_memory_equities.json',
      Object.fromEntries(this.equitiesTradingSymbolReferenceMap),
    );

    await DataService.writeJsonToFile(
      '/Users/facinick/Repositories/blackbox/src/data/jul5_token_memory_derivatives.json',
      Object.fromEntries(this.derivativesTokenReferenceMap),
    );
  }

  public getTickSizeForTradingsymbol = (tradingSymbol: Tradingsymbol) => {
    if (this.equitiesTradingSymbolReferenceMap.has(tradingSymbol)) {
      return this.equitiesTradingSymbolReferenceMap.get(tradingSymbol).tickSize;
    } else if (
      this.derivativesTradingsymbolReferenceMap.has(
        tradingSymbol as DerivativeTradingsymbol,
      )
    ) {
      return this.derivativesTradingsymbolReferenceMap.get(
        tradingSymbol as DerivativeTradingsymbol,
      ).tickSize;
    } else {
      throw new Error(
        `trading symbol you're dealing with isnt in the database buddy`,
      );
    }
  }

  private loadDerivatives = async () => {
    console.log(`loading derivatives in-memory`)
    const rawFileExists = await DataService.fileExists(this.RAW_DERIVATIVES_FILENAME);

    if (rawFileExists) {
      // read
      console.log(`reading from file: ${this.RAW_DERIVATIVES_FILENAME}`)
      const rawDerivatives = (await DataService.readJsonFromFile(
        this.RAW_DERIVATIVES_FILENAME,
      )) as RawDerviative[];
      // transform and process
      await this.processDerivatives(rawDerivatives);
    } else {
      // fetch
      console.log(`file not found`)
      console.log(`fetching derivatives...`)
      const rawDerivatives = await this.apiService.getAvailableDerivatives();
      // write
      console.log(`writing derivatives to ${this.RAW_DERIVATIVES_FILENAME}`)
      await DataService.writeJsonToFile(
        this.RAW_DERIVATIVES_FILENAME,
        rawDerivatives,
      );
      // load
      this.loadDerivatives();
    }
  }

  public getEquityInfoFromToken = (equityToken: EquityToken) => {
    return this.equitiesTokenReferenceMap.get(equityToken);
  }

  public getDerivativeInfoFromToken = (derivativeToken: DerivativeToken) => {
    return this.derivativesTokenReferenceMap.get(derivativeToken);
  }

  public getDerivativeInfoFromTradingSymbol = (
    tradingSymbol: DerivativeTradingsymbol,
  ) => {
    for (const [key, value] of this.derivativesTokenReferenceMap) {
      if (value.tradingsymbol === tradingSymbol) {
        return value;
      }
    }

    throw new Error(`unexpected: cannot find derivative for the given symbol`);
  }

  public getDerivativeExpiryInfoFromDerivativeToken(
    derivativeToken: DerivativeToken,
  ) {
    return this.derivativesTokenReferenceMap.get(derivativeToken).expiry;
  }

  public getNStrikesUpFromDerivativeToken = (
    derivativeToken: DerivativeToken,
    n = 1,
  ) => {
    const derivativeInfo =
      this.derivativesTokenReferenceMap.get(derivativeToken);

    // const currentStrike = derivativeInfo.strike

    const nStrikesNext = derivativeInfo.strike + derivativeInfo.stepSize * 1;

    return nStrikesNext;
  }

  private loadEquities = async () => {
    const rawFileExists = await DataService.fileExists(this.RAW_EQUITIES_FILENAME);

    if (rawFileExists) {
      // read
      const rawEquities = (await DataService.readJsonFromFile(
        this.RAW_EQUITIES_FILENAME,
      )) as RawEquity[];
      // transform and process
      await this.processEquities(rawEquities);
    } else {
      // fetch
      const rawEquities = await this.apiService.getAvailableEquities();
      // write
      await DataService.writeJsonToFile(
        this.RAW_EQUITIES_FILENAME,
        rawEquities,
      );
      // load
      this.loadEquities();
    }
  }

  private processDerivatives = (rawDerivatives: RawDerviative[]) => {
    console.log(`processing derivatives`)
    const uniqueExpiries: Set<string> = new Set();

    rawDerivatives.forEach((rawDerivative) => {
      // redundant check, until we have value objects that can validate in themselves
      if (
        rawDerivative.exchange !== 'NFO' ||
        rawDerivative.segment !== 'NFO-OPT' ||
        !['CE', 'PE'].includes(rawDerivative.instrument_type)
      ) {
        return;
      }

      if (!derivativeNameExists(rawDerivative.name)) {
        return;
      }

      const tokenKey = parseInt(
        rawDerivative.instrument_token,
      ) as DerivativeToken;

      const tradingSymbolKey =
        rawDerivative.tradingsymbol as DerivativeTradingsymbol;

      const value = DataService.rawDerivativeToDomain(rawDerivative);

      // passing same object reference, to access data using both token and symbol
      this.derivativesTokenReferenceMap.set(tokenKey, value);
      this.derivativesTradingsymbolReferenceMap.set(tradingSymbolKey, value);

      // Populate the uniqueExpiries set
      const expiryDate = new Date(rawDerivative.expiry);
      uniqueExpiries.add(expiryDate.toISOString());
    });

    console.log(`processed derivatives`)

    this.processExpiries(uniqueExpiries);
  }

  private processExpiries = (uniqueExpiries: Set<string>) => {
    console.log(`processing expiry data`)
    this.expiries = Array.from(uniqueExpiries).map((expiryString) => {
      const expiryDate = new Date(expiryString);
      return {
        date: expiryDate.getDate(),
        month: DataService.getMonthAbbreviation(expiryDate.getMonth()),
        year: expiryDate.getFullYear(),
      };
    });

    // Sort the expiries array in ascending order
    this.expiries.sort((a, b) => {
      const dateA = new Date(
        a.year,
        DataService.getMonthIndex(a.month),
        a.date,
      );
      const dateB = new Date(
        b.year,
        DataService.getMonthIndex(b.month),
        b.date,
      );
      return dateA.getTime() - dateB.getTime();
    });
    console.log(`processed expiry data`)
  }

  private linkDerivatives = () => {
    for (const [key, value] of this.derivativesTokenReferenceMap) {
      const derivativeName = value.name;

      const correspondingEquityTradingsymbol =
        getEquityTradingsymbolByDerivativeName(derivativeName);

      if (value.instrumentType === 'CE') {
        // gets reference to calls array.
        const calls = this.equitiesTradingSymbolReferenceMap.get(
          correspondingEquityTradingsymbol,
        ).calls;

        calls.push(key);
      } else if (value.instrumentType === 'PE') {
        // gets reference to puts array.
        const puts = this.equitiesTradingSymbolReferenceMap.get(
          correspondingEquityTradingsymbol,
        ).puts;

        puts.push(key);
      } else {
        throw new Error(`unexpected instrument type: ${value.instrumentType}`);
      }
    }
  }

  private calculateStepSizeFromCallsAndUpdateDerivatives = () => {
    for (const [key, value] of this.equitiesTradingSymbolReferenceMap) {
      const calls = value.calls;
      let stepSize;

      if (calls.length >= 2) {
        const firstCall = this.getDerivativeInfoFromToken(calls[0]);

        const secondCall = this.getDerivativeInfoFromToken(calls[1]);

        stepSize = secondCall.strike - firstCall.strike;

        this.equitiesTradingSymbolReferenceStepSizeMap.set(key, stepSize);
      } else {
        throw new Error(`Cannot calculate step size, not enough information.`);
      }
    }

    for (const [key, value] of this.derivativesTokenReferenceMap) {
      const equityTradingSymbol = getEquityTradingsymbolByDerivativeName(
        value.name,
      );

      value.stepSize =
        this.equitiesTradingSymbolReferenceStepSizeMap.get(equityTradingSymbol);
    }
  }

  static rawDerivativeToDomain = (rawDerivative: RawDerviative): MappedDerivative => {
    const token = parseInt(rawDerivative.instrument_token) as DerivativeToken;

    const name = rawDerivative.name as DerivativeName;

    const tradingsymbol =
      rawDerivative.tradingsymbol as DerivativeTradingsymbol;

    const tradingsymbolParsed = DataService.parseDerivativeTradingSymbol(
      rawDerivative.tradingsymbol as DerivativeTradingsymbol,
    );

    const expiry = rawDerivative.expiry as DerivativeExpiry;

    const expiryParsed = DataService.parseExpiry(
      rawDerivative.expiry,
    ) as DerivativeExpiryParsed;

    const strike = rawDerivative.strike as StrikePrice;

    const tickSize = rawDerivative.tick_size as DerivativeTickSize;

    const stepSize = 0; // to be calculated while linking

    const lotSize = rawDerivative.lot_size as DerivativeLotSize;

    const instrumentType =
      rawDerivative.instrument_type as DerivativeInstrumentType;

    const exchange = rawDerivative.exchange as DerivativeExchange;

    const segment = rawDerivative.segment as DerivativeSegment;

    return {
      token,
      name,
      tradingsymbol,
      tradingsymbolParsed,
      expiry,
      stepSize,
      expiryParsed,
      strike,
      tickSize,
      lotSize,
      instrumentType,
      exchange,
      segment,
    };
  }

  private processEquities = (rawEquities: RawEquity[]) => {
    rawEquities.forEach((rawEquitie) => {
      // redundant check
      if (
        rawEquitie.exchange !== 'NSE' ||
        rawEquitie.segment !== 'NSE' ||
        rawEquitie.instrument_type !== 'EQ'
      ) {
        return;
      }

      if (!equityTradingsymbolExists(rawEquitie.tradingsymbol)) {
        return;
      }

      const tokenKey = parseInt(rawEquitie.instrument_token) as EquityToken;

      const tradingSymbolKey = rawEquitie.tradingsymbol as EquityTradingsymbol;

      const value = DataService.rawEquityToDomain(rawEquitie);

      this.equitiesTokenReferenceMap.set(tokenKey, value);

      this.equitiesTradingSymbolReferenceMap.set(tradingSymbolKey, value);
    });
  }

  static rawEquityToDomain = (rawEquity: RawEquity): MappedEquity => {
    const token = parseInt(rawEquity.instrument_token) as EquityToken;

    const tradingsymbol = rawEquity.tradingsymbol as EquityTradingsymbol;

    const tickSize = rawEquity.tick_size as EquityTickSize;

    const instrumentType = rawEquity.instrument_type as EquityInstrumentType;

    const exchange = rawEquity.exchange as EquityExchange;

    const segment = rawEquity.segment as EquitySegment;

    return {
      token,
      tradingsymbol,
      tickSize,
      instrumentType,
      exchange,
      segment,
      calls: [],
      puts: [],
    };
  }

  private setFilenamesForToday = () => {
    const today = new Date();
    const dateString = `${today.toLocaleString('default', { month: 'short' }).toLowerCase()}${today.getDate()}`;

    this.RAW_DERIVATIVES_FILENAME = path.join(__dirname, '..', `${dateString}_raw_derivatives.json`);
    this.RAW_EQUITIES_FILENAME = path.join(__dirname, '..', `${dateString}_raw_equities.json`);

    console.log(`set filenames`), {
      derivatives: this.RAW_DERIVATIVES_FILENAME,
      equities: this.RAW_EQUITIES_FILENAME
    }
  }

  static DERRIVATIVE_TRADING_SYMBOL_REGEX =
    /^([A-Z][A-Z]+)(\d{1,2})([A-Z]{3})(\d+(\.\d+)?)(PE|CE)$/;

  static parseDerivativeTradingSymbol = (
    derivativeTradingSymbol: DerivativeTradingsymbol,
  ): DerivativeTradingsymbolParsed => {
    const match = derivativeTradingSymbol.match(
      DataService.DERRIVATIVE_TRADING_SYMBOL_REGEX,
    );

    if (!match) {
      throw new Error(
        `Invalid trading symbol format: ${derivativeTradingSymbol}`,
      );
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
    const [, name, date, month, strike, junk, instrumentType] = match;

    return {
      name,
      date: parseInt(date) as DerivativeExpiryParsed['date'],
      month: month as DerivativeExpiryParsed['month'],
      strike: parseInt(strike) as DerivativeTradingsymbolParsed['strike'],
      instrumentType:
        instrumentType as DerivativeTradingsymbolParsed['instrumentType'],
    };
  }

  static parseExpiry = (expiry: string): DerivativeExpiryParsed => {
    const date = new Date(expiry);
    const month = date
      .toLocaleString('default', { month: 'short' })
      .toUpperCase() as ExpiryMonth;
    const _date = date.getDate() as ExpiryDate;
    const year = date.getFullYear() as ExpiryYear;
    return { date: _date, month, year };
  }

  static writeJsonToFile = async (filePath: string, data: any): Promise<void> => {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonData, 'utf8');
  }

  static readJsonFromFile = async (filePath: string): Promise<any> => {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  static fileExists = async (filePath: string): Promise<boolean> => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static isCallOption = (tradingSymbol: DerivativeTradingsymbol) => {
    try {
      const parsedTradingsymbol =
        DataService.parseDerivativeTradingSymbol(tradingSymbol);
      if (parsedTradingsymbol.instrumentType === 'CE') {
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  static isDerivative = (
    tradingSymbol: EquityTradingsymbol | DerivativeTradingsymbol,
  ) => {
    try {
      const parsedTradingsymbol = DataService.parseDerivativeTradingSymbol(
        tradingSymbol as DerivativeTradingsymbol,
      );
      if (
        parsedTradingsymbol.instrumentType === 'CE' ||
        parsedTradingsymbol.instrumentType === 'PE'
      ) {
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  isExpiringInMonth = (
    tradingSymbol: DerivativeTradingsymbol,
    month: ExpiryMonth,
  ) => {
    const derivativeInfo =
      this.derivativesTradingsymbolReferenceMap.get(tradingSymbol);

    return (
      derivativeInfo.expiryParsed.month.toLocaleLowerCase() ===
      month.toLocaleLowerCase()
    );
  }

  hasNDaysToExpiry = (tradingSymbol: DerivativeTradingsymbol, n: number) => {
    const today = DataService.getToday();

    const derivativeData =
      this.derivativesTradingsymbolReferenceMap.get(tradingSymbol);

    if (!derivativeData) {
      throw new Error(`no derivative data found for: ${tradingSymbol}`);
    }

    const expiryDate = new Date(
      derivativeData.expiryParsed.year,
      DataService.getMonthIndex(derivativeData.expiryParsed.month),
      derivativeData.expiryParsed.date,
    );

    const currentDate = new Date(
      today.year,
      DataService.getMonthIndex(today.month),
      today.date,
    );

    // Calculate difference in milliseconds between expiry date and current date
    const timeDiff = expiryDate.getTime() - currentDate.getTime();

    // Convert milliseconds to days
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff === n;
  }

  static isPutOption = (tradingSymbol: DerivativeTradingsymbol) => {
    try {
      const parsedTradingsymbol =
        DataService.parseDerivativeTradingSymbol(tradingSymbol);
      if (parsedTradingsymbol.instrumentType === 'PE') {
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  static getToday = (): {
    date: ExpiryDate;
    month: ExpiryMonth;
    year: ExpiryYear;
  } => {
    const now = new Date();

    return {
      date: now.getDate(),
      month: DataService.getMonthAbbreviation(now.getMonth()),
      year: now.getFullYear(),
    };
  }

  static getMonthIndex = (month: ExpiryMonth): number => {
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
    };
    return monthIndexMap[month];
  }

  static getMonthAbbreviation = (monthIndex: number): ExpiryMonth => {
    const date = new Date(2000, monthIndex, 1);
    const options = { month: 'short' } as const;
    return date.toLocaleString('en-US', options).toUpperCase() as ExpiryMonth;
  }

  public getNearestExpiry = () => {
    return this.expiries.at(0);
  }

  public getNearestExpiryForMonth = (
    month: ExpiryMonth,
  ): DerivativeExpiryParsed | null => {
    for (const expiry of this.expiries) {
      if (expiry.month === month) {
        return expiry;
      }
    }
  }

  public getAvailableOTMCallOptionFor = (
    tradingsymbol: EquityTradingsymbol,
    expiryMonth: ExpiryMonth,
    atmPrice: number,
  ): MappedDerivative | undefined => {
    const positions = this.getAvailableCallOptionsFor(
      tradingsymbol,
      expiryMonth,
    );

    for (const position of positions) {
      if (position.strike >= atmPrice) {
        return position;
      }
    }
  }

  public getAvailableCallOptionsFor = (
    tradingsymbol: EquityTradingsymbol,
    expiryMonth: ExpiryMonth,
  ): MappedDerivative[] => {
    const callOptions: Array<MappedDerivative> = [];

    const calls =
      this.equitiesTradingSymbolReferenceMap.get(tradingsymbol).calls;

    for (const callOptionToken of calls) {
      if (this.derivativesTokenReferenceMap.has(callOptionToken)) {
        const derivative =
          this.derivativesTokenReferenceMap.get(callOptionToken);

        if (derivative.expiryParsed.month === expiryMonth) {
          callOptions.push(
            this.derivativesTokenReferenceMap.get(callOptionToken),
          );
        }
      }
    }

    callOptions.sort((a, b) => {
      const expiryA = new Date(a.expiry).getTime();
      const expiryB = new Date(b.expiry).getTime();

      if (expiryA !== expiryB) {
        return expiryA - expiryB;
      } else {
        return a.strike - b.strike;
      }
    });

    return callOptions;
  }
}