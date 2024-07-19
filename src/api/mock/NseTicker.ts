import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { ZTick } from '../zerodha/types';
import { NseHistoricalData, NseMapper } from './nseMapper';

export class NseTicker {
  private directory: string;
  private data: Map<number, (ZTick & { date: string })[]> = new Map();
  private index = 0

  private latestTicks: ZTick[] 

  constructor(directory: string) {
    this.directory = directory;
  }

  initialize = async () => {
    await this.readAllFiles()
  }

  private readAllFiles = async () => {
    const files = fs.readdirSync(this.directory).filter(file => file.endsWith('.csv'));
    console.log(`all files in local directory:`, files);

    const promises = [];
    for (const file of files) {
      const filePath = path.join(this.directory, file);
      console.log(`reading file: ${filePath}`);

      const instrumentToken = parseInt(path.basename(file, '.csv'));
      const fileData = [];

      promises.push(new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row: NseHistoricalData) => {
            const mappedData = NseMapper(row, instrumentToken);
            fileData.push(mappedData);
          })
          .on('end', () => {
            this.data.set(instrumentToken, fileData);
            resolve({}); // Resolve the individual promise for each file
          })
          .on('error', reject);
      }));
    }

    try {
      // Wait for all promises to resolve (all files read)
      await Promise.all(promises);
      return {}; // Resolve the main promise after all files are processed
    } catch (error) {
      // Handle any errors that occurred during file reading
      return Promise.reject(error);
    }
  }

  private isWithinDateRange(date: Date, fromDate: Date, toDate: Date): boolean {

    if (date < fromDate) return false;
    if (date > toDate) return false;

    return true;
  }

  *generator(fromDateStr?: string, toDateStr?: string) {
    this.index = 0;
    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;
    const tickArrays = Array.from(this.data.values());
    while (tickArrays.some(array => array[this.index])) {
      const ticks: ZTick[] = tickArrays.map(array => array[this.index])
        .filter(Boolean) // Remove undefined
        .filter(tick => this.isWithinDateRange(new Date(tick.date), fromDate, toDate)); // Filter by date range

      if (ticks.length > 0) {
        yield ticks;
        this.latestTicks = ticks
      }
      this.index++;
    }
  }

  peek = () => {
    return this.latestTicks
  }
}