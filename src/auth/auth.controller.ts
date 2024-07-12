import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Redirect()
  async login() {
    console.log(`route: /login`)
    try {
      console.log(`attempting to log in with existing token`)
      await this.authService.loginWithExistingRequestToken()
      console.log(`redirecting...`)
      return {
        url: 'http://localhost:3000/'
      }
    } catch(error) {
      console.log(`failed to login with existing token, redirecting to zerodha for login`)
      const loginUrl = await this.authService.getLoginUrl()
      return {
        url: loginUrl
      };
    }
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('request_token') request_token: string) {
    console.log(`route: /callback?request_token=${request_token}`)
    const session = await this.authService.generateSession(request_token);
    console.log(`generated session`, session)
    await this.authService.setRequestToken(request_token)
    console.log(`saved request token`)
    await this.authService.saveSession(session)
    console.log(`redirecting...`)
    return {
      url: 'http://localhost:3000/'
    }
  }

  @Get('refresh')
  async refresh() {
    await this.authService.refresh();
    return "access token refreshed"
  }

  @Get('logout')
  async logout() {
    await this.authService.logout()
  }
}
