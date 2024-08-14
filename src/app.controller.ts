import { Controller, Get, Post, Query, Redirect, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { KiteConnect } from 'kiteconnect'
import { AppService } from './app.service'
import { AppLogger } from './logger/logger.service'

@Controller()
export class AppController {
  private readonly kc: KiteConnect

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name)
    // const apiKey = this.configService.get('ZERODHA_API_KEY')
    // if (!apiKey) {
    //   throw new Error(`No API Key found to initialize Zerodha API`)
    // }
    // this.kc = new KiteConnect({
    //   api_key: apiKey,
    // })
  }

  // @Get()
  // async init(@Res() res: Response) {
  //   try {
  //     const userId = this.configService.get('ZERODHA_USER_ID')
  //     const accessToken = await this.tokenService.getAccessToken(userId)

  //     if (!accessToken) {
  //       this.logger.log(`No access token found, redirecting to zerodha`)
  //       const loginUrl = this.kc.getLoginURL()
  //       return res.redirect(loginUrl)
  //     }
  //     const apiKey = this.configService.get('ZERODHA_API_KEY')
  //     if (!apiKey) {
  //       throw new Error(`No API Key found to initialize Zerodha API`)
  //     }
  //     await this.appService.initialize(accessToken, apiKey)
  //     this.logger.log('App is initialized')
  //     return res.send('App is initialized and running')
  //   } catch (error) {
  //     this.logger.error(
  //       'Error logging in with existing access token, redirecting to zerodha',
  //       error,
  //     )
  //     const loginUrl = this.kc.getLoginURL()
  //     return res.redirect(loginUrl)
  //   }
  // }

  // @Get('callback/zerodha')
  // @Redirect()
  // async callback(@Query('request_token') requestToken: string) {
  //   const apiSecret = this.configService.get('ZERODHA_API_SECRET')
  //   if (!apiSecret) {
  //     throw new Error(`No API Secret found to generate zerodha session`)
  //   }
  //   const session = await this.kc.generateSession(requestToken, apiSecret)
  //   this.logger.log(`New session generated:`, session)
  //   const userId = this.configService.get('ZERODHA_USER_ID')
  //   if (!userId) {
  //     throw new Error(`No User ID found`)
  //   }
  //   await this.tokenService.upsertAccessToken(userId, session.access_token)
  //   this.logger.log(`Saves new access token in database`)
  //   this.logger.log(`Redirecting to home`)
  //   return {
  //     url: 'http://localhost:3000/',
  //   }
  // }

  // @Post('start-strategy')
  // async startStrategy() {
  //   await this.appService.initialize(accessToken, apiKey)
  // }
}
