import { Injectable } from "@nestjs/common";
import { ApiService } from "src/api/api.service";

const API_SECRET = ""

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

    private accessToken: string;
    private requestToken: string;

    constructor(private readonly apiService: ApiService){ }

    public getLoginUrl() {
        return this.apiService.getLoginURL()
    }

    public async generateSession(requestToken: string) {
        this.requestToken = requestToken
        const sessionData = await this.apiService.generateSession(this.requestToken, API_SECRET)
        this.setAccessToken(sessionData.access_token)
        this.initializeTicker()
    }

    public logout() {
        this.apiService.invalidateAccessToken()
        this.accessToken = null;
    }

    public async refresh() {
        const sessionData = await this.apiService.renewAccessToken(this.requestToken, API_SECRET)
        this.setAccessToken(sessionData.access_token)
    }

    private setAccessToken(accessToken: string) {
        this.accessToken = accessToken
        this.apiService.setAccessToken(this.accessToken)
    }

    private initializeTicker() {
        this.apiService.initializeTicker(this.accessToken)
    }

}