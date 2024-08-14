import { DynamicModule, Global, Module } from '@nestjs/common'
import { API_SERVICE } from './api.service'
import { ZerodhaApiService } from './zerodha/zerodha.api.service'
import { MockApiService } from './mock/mock-api.service'
import { ApiController } from './api.controller'
import { AuthModule } from 'src/auth/auth.module'

export type ApiConfiguration = {
  environment: 'production' | 'development'
  broker: 'zerodha'
}

@Global()
@Module({})
export class ApiModule {
  static forRoot({ environment, broker }: ApiConfiguration): DynamicModule {
    return {
      module: ApiModule,
      providers: [
        {
          provide: API_SERVICE,
          useClass:
            environment === 'development' ? MockApiService : ZerodhaApiService,
        }
      ],
      imports: [AuthModule],
      controllers: [ApiController],
      exports: [API_SERVICE],
    }
  }
}
