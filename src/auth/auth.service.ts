import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiService } from 'src/api/api.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from './token.service';

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
  ) {}

  public async loginWithExistingRequestToken() {

    const requestToken = await this.tokenService.getRequestToken();

    if (requestToken) {
      try {
        await this.generateSession(requestToken);
      } catch (error) {
        await this.tokenService.clearTokens();
        throw new Error(`invallid request token in db`)
      }
    } else {
      throw new Error(`no request token in db`)
    }

  }

  public getLoginUrl() {
    return this.apiService.getLoginURL();
  }

  public async generateSession(requestToken: string) {
    this.tokenService.saveRequestToken(requestToken)
    const sessionData = await this.apiService.generateSession(
      requestToken,
      this.configService.get("ZERODHA_API_SECRET"),
    );
    this.tokenService.saveAccessToken(sessionData.refresh_token)
    this.setRefreshToken(sessionData.refresh_token)
    this.setAccessToken(sessionData.access_token);
    this.initializeTicker(sessionData.access_token);
  }

  public async logout() {

    const accessToken = await this.tokenService.getAccessToken()
    const refreshToken = await this.tokenService.getRefreshToken()

    await this.apiService.invalidateAccessToken(accessToken);
    await this.apiService.invalidateRefreshToken(refreshToken);

    this.tokenService.clearTokens()
  }

  public async refresh() {

    const refreshToken = await this.tokenService.getRefreshToken()

    const sessionData = await this.apiService.renewAccessToken(
      refreshToken,
      this.configService.get("ZERODHA_API_SECRET"),
    );
    this.setAccessToken(sessionData.access_token);
  }

  private async setAccessToken(accessToken: string) {
    this.tokenService.saveAccessToken(accessToken)
    this.apiService.setAccessToken(accessToken);
  }


  private async setRefreshToken(refreshToken: string) {
    this.tokenService.saveRefreshToken(refreshToken)
  }

  private initializeTicker(accessToken: string) {
    this.apiService.initializeTicker(accessToken);
  }
}
