import { Instrument } from './data';

interface DataApiPort {
  getTradableEquities: () => Promise<Instrument[]>;
  getTradableDerivatives: () => Promise<Instrument[]>;
}

export { DataApiPort };
