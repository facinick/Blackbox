import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppLogger } from 'src/logger/logger.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger
  ) { 
    this.logger.setContext(this.constructor.name)
  }

  @Get('login')
  @Redirect()
  async login() {
    const requestToken = await this.authService.findExistingRequestToken()
    if (requestToken) {
      try {
        await this.authService.loginWithRequestToken(requestToken)
        this.logger.log(`logged in successfully, redirecting to home`)
        return {
          url: 'http://localhost:3000/'
        }
      } catch (error) {
        const loginUrl = await this.authService.getLoginUrl()
        this.logger.log(`redirecting to kite for logging in`)
        return {
          url: loginUrl
        }
      }
    } else {
      const loginUrl = await this.authService.getLoginUrl()
      return {
        url: loginUrl
      }
    }
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('request_token') request_token: string) {
    const session = await this.authService.generateSession(request_token);
    await this.authService.setRequestToken(request_token)
    await this.authService.saveSession(session)
    this.logger.log(`logged in successfully, redirecting to home`)
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
