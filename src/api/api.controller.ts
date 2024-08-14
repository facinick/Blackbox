import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AccessGuard } from 'src/auth/auth.guard'
import { AppLogger } from 'src/logger/logger.service'
import { API_SERVICE, ApiService } from './api.service'
import { DataService } from 'src/data/data.service'
import { Exchange, InstrumentType } from 'src/types/app/entities'

@Controller('api')
export class ApiController {

    constructor(
        @Inject(API_SERVICE)
        private readonly apiService: ApiService,
        private readonly logger: AppLogger,
        private readonly configService: ConfigService,
    ) {
        this.logger.setContext(this.constructor.name)
    }

    @UseGuards(AccessGuard)
    @Get('balance')
    async getBalance() {
        return this.apiService.getBalance()
    }

    @UseGuards(AccessGuard)
    @Get('holdings')
    async getHoldings() {
        return this.apiService.getHoldings()
    }

    @UseGuards(AccessGuard)
    @Get('positions')
    async getPositions() {
        return this.apiService.getPositions()
    }

    @UseGuards(AccessGuard)
    @Get('derivatives/options')
    async getAvailableOptions() {
        return DataService.getInstruments({
            // only supporting NFO atm
            exchange: [Exchange.NFO],
            // options = CE and PE
            instrumentType: [InstrumentType.CE, InstrumentType.PE]
        })
    }
}
