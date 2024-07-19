import { Global, Module } from '@nestjs/common'
import { API_SERVICE } from './api.service'
import { ZerodhaApiService } from './zerodha/zerodha.api.service'
import { MockApiService } from './mock/mock-api.service'

@Global()
@Module({
  providers: [
    {
      provide: API_SERVICE,
      useClass: MockApiService,
    },
  ],
  exports: [API_SERVICE],
})
export class ApiModule {}
