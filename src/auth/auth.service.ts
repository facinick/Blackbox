import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiService } from 'src/api/api.service';
import { TokenService } from './token.service';
import { AppLogger } from 'src/logger/logger.service';

/*
Login flow¶
The login flow starts by navigating to the public Kite login endpoint.

https://kite.zerodha.com/connect/login?v=3&api_key=xxx

A successful login comes back with a request_token as a URL query parameter to the redirect URL registered on the developer console for that api_key. 
This request_token, along with a checksum (SHA-256 of api_key + request_token + api_secret) is POSTed to the token API to obtain an access_token, 
which is then used for signing all subsequent requests. 

In summary:
Navigate to the Kite Connect login page with the api_key
A successful login comes back with a request_token to the registered redirect URL
POST the request_token and checksum (SHA-256 of api_key + request_token + api_secret) to /session/token
Obtain the access_token and use that with all subsequent requests
An optional redirect_params param can be appended to public Kite login endpoint, that will be sent back to the redirect URL. The value is URL encoded query params string, eg: some=X&more=Y). eg: https://kite.zerodha.com/connect/login?v=3&api_key=xxx&redirect_params=some%3DX%26more%3DY

*/

@Injectable()
export class AuthService {

  constructor(
    private readonly apiService: ApiService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly logger: AppLogger
  ) {
    this.logger.setContext(this.constructor.name)
  }

  public findExistingRequestToken = async () => {
    const requestToken = await this.tokenService.getRequestToken();
    this.logger.debug(`Found request token in db: ${requestToken}`)
    return requestToken
  }

  public loginWithRequestToken = async (requestToken: string) => {
    try {
      const session = await this.generateSession(requestToken);
      await this.setRequestToken(requestToken)
      await this.saveSession(session)
    } catch (error) {
      this.logger.debug(`Failed to login with request token: ${requestToken}`, error)
      await this.tokenService.clearTokens();
      throw new Error(`invalid request token in db`)
    }
  }

  public getLoginUrl = () => {
    return this.apiService.getLoginURL();
  }

  public generateSession = async (requestToken: string) => { 
    return this.apiService.generateSession(
      requestToken,
      this.configService.get("ZERODHA_API_SECRET"),
    );
  }

  public saveSession = async (session: ZSession) => {
    await this.setAccessToken(session.access_token);
    this.initializeTicker(session.access_token);
  }

  public logout = async () => {
    const accessToken = await this.tokenService.getAccessToken()
    // const refreshToken = await this.tokenService.getRefreshToken()
    await this.apiService.invalidateAccessToken(accessToken);
    // await this.apiService.invalidateRefreshToken(refreshToken);
    await this.tokenService.clearTokens()
  }

  public refresh = async () => {
    const refreshToken = await this.tokenService.getRefreshToken()
    const sessionData = await this.apiService.renewAccessToken(
      refreshToken,
      this.configService.get("ZERODHA_API_SECRET"),
    );
    this.setAccessToken(sessionData.access_token);
  }

  private setAccessToken = async (accessToken: string) => {
    await this.tokenService.saveAccessToken(accessToken)
    this.apiService.setAccessToken(accessToken);
  }

  public setRequestToken = async (requestToken: string) => {
    await this.tokenService.saveRequestToken(requestToken)
  }

  private setRefreshToken = async (refreshToken: string) => {
    await this.tokenService.saveRefreshToken(refreshToken)
  }

  private initializeTicker = (accessToken: string) => {
    this.apiService.initializeTicker(accessToken);
  }
}
