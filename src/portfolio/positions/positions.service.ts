import { Inject, Injectable } from '@nestjs/common'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import { DataService } from 'src/data/data.service'
import { openPositionFilter } from './filters'
import { AppLogger } from 'src/logger/logger.service'
import { Position } from './Positions'
import { BuyOrSell, ExpiryMonth, InstrumentType } from 'src/types/app/entities'

@Injectable()
export class PositionsService {
  private netPositions: Position[]
  private dayPositions: Position[]

  constructor(
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  initialize = async () => {
    this.logger.log(`inintializing positions service`)
    await this.syncPositions()
  }

  public syncPositions = async () => {
    const {net, day} = await this.apiService.getPositions()
    this.netPositions = net
    this.dayPositions = day
    this.logger.log(`net positions updated:`, this.netPositions)
    this.logger.log(`day positions updated:`, this.dayPositions)
  }

  getNetPositions = () => {
    return this.netPositions
  }

  getOpenDerivativePositions = (): Position[] => {
    const positions = this.netPositions.filter(position => {
      const instrument = DataService.getInstument(position.token)
      return position.quantity !== 0 && [InstrumentType.CE, InstrumentType.PE].includes(instrument.instrumentType)
    })

    return positions
  }
}
