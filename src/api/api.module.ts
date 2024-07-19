import { Global, Module } from '@nestjs/common'
import { API_SERVICE } from './api.service'
import { ZerodhaApiService } from './zerodha.api.service'

@Global()
@Module({
  providers: [
    {
      provide: API_SERVICE,
      useClass: ZerodhaApiService,
    },
  ],
  exports: [API_SERVICE],
})
export class ApiModule {}
