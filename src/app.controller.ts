import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common'
import { AppService } from './app.service'
import { TokenService } from './token.service'
import { ConfigService } from '@nestjs/config'
import { AppLogger } from './logger/logger.service'
import { KiteConnect } from 'kiteconnect'

@Controller()
export class AppController {
  private readonly kc: KiteConnect

  constructor(
    private readonly appService: AppService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
    const apiKey = this.configService.get('ZERODHA_API_KEY')
    if (!apiKey) {
      throw new Error(`No API Key found to initialize Zerodha API`)
    }
    this.kc = new KiteConnect({
      api_key: apiKey,
    })
  }

  @Get()
  @Redirect()
  async init() {
    try {
      const userId = this.configService.get('ZERODHA_USER_ID')
      const accessToken = await this.tokenService.getAccessToken(userId)

      if (!accessToken) {
        this.logger.log(`No access token found, redirecting to zerodha`)
        const loginUrl = this.kc.getLoginURL()
        return {
          url: loginUrl,
        }
      }
      const apiKey = this.configService.get('ZERODHA_API_KEY')
      if (!apiKey) {
        throw new Error(`No API Key found to initialize Zerodha API`)
      }
      await this.appService.initialize(accessToken, apiKey)
      this.logger.log('App is initialized')
    } catch (error) {
      this.logger.error(
        'Error logging in with existing access token, redirecting to zerodha',
        error,
      )
      const loginUrl = this.kc.getLoginURL()
      return {
        url: loginUrl,
      }
    }
  }

  @Get('callback/zerodha')
  @Redirect()
  async callback(@Query('request_token') requestToken: string) {
    const apiKey = this.configService.get('ZERODHA_API_KEY')
    if (!apiKey) {
      throw new Error(`No API Key found to generate zerodha session`)
    }
    const session = await this.kc.generateSession(requestToken, apiKey)
    this.logger.log(`New session generated:`, session)
    const userId = this.configService.get('ZERODHA_USER_ID')
    if (!userId) {
      throw new Error(`No User ID found`)
    }
    await this.tokenService.upsertAccessToken(userId, session.access_token)
    this.logger.log(`Saves new access token in database`)
    this.logger.log(`Redirecting to home`)
    return {
      url: 'http://localhost:3000/',
    }
  }
}
