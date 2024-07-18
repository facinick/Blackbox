import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppLogger } from 'src/logger/logger.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @Get('login')
  @Redirect()
  async login() {
    try {
      await this.authService.tryUsingPreviousSession();
      this.logger.log(`logged in successfully, redirecting to home`);
      return {
        url: 'http://localhost:3000/',
      };
    } catch (error) {
      this.logger.error("error auto login", error)
      this.logger.log(`redirecting to kite for logging in`);
      const loginUrl = await this.authService.getLoginUrl();
      return {
        url: loginUrl,
      };
    }
  }

  @Get('callback')
  @Redirect()
  async callback(@Query('request_token') request_token: string) {
    const session = await this.authService.generateNewSession(request_token);
    this.logger.log(`session:`, session)
    await this.authService.useAccessToken(session.access_token);
    this.logger.log(`logged in successfully, redirecting to home`);
    return {
      url: 'http://localhost:3000/',
    };
  }

  @Get('logout')
  async logout() {
    await this.authService.logout();
  }
}
