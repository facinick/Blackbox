import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KiteConnect } from 'kiteconnect';
import { ApiService } from 'src/api/api.service';
import { TokenService } from './token.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppLogger } from 'src/logger/logger.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly apiService: ApiService,
    private readonly logger: AppLogger,
  ) { 
    this.logger.setContext(this.constructor.name)
  }

  async tryUsingPreviousSession(): Promise<void> {
    this.logger.debug(`fetching existing ccess token`)
    const accessToken = await this.tokenService.getAccessToken(this.configService.get("ZERODHA_USER_ID"));
    this.logger.debug(`token:`, accessToken)
    if (!accessToken) {
      throw new UnauthorizedException('No access token found');
    }
    try {
      this.logger.debug(`validating existing access token:`, accessToken)
      await this.useAccessToken(accessToken)
      this.logger.debug(`done`)
    } catch (error) {
      throw new UnauthorizedException('Access token has expired');
    }
  }

  public generateNewSession = async (requestToken: string) => { 
    const session = await this.apiService.generateSession(requestToken, this.configService.get("ZERODHA_API_SECRET"))
    return session
  }

  public useAccessToken = async (accessToken) => {
    await this.apiService.setAccessToken(accessToken); 
    await this.apiService.getHoldings();
    this.apiService.initializeTicker(accessToken);
    await this.tokenService.upsertAccessToken(this.configService.get("ZERODHA_USER_ID"), accessToken)
  }

  async logout(): Promise<void> {
    const accessToken = await this.tokenService.getAccessToken(this.configService.get("ZERODHA_USER_ID"));
    if(accessToken) {
      await this.apiService.invalidateAccessToken(accessToken);
    }
    await this.tokenService.clearTokens(this.configService.get("ZERODHA_USER_ID"));
  }

  async getLoginUrl(): Promise<string> {
    return this.apiService.getLoginURL();
  }
}
