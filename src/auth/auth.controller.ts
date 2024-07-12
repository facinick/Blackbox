import {
  Controller,
  Param,
  Post,
  Redirect,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Redirect()
  async login() {

    try {
      await this.authService.loginWithExistingRequestToken()
      return "app is authenticated"
    } catch(error) {
      const loginUrl = await this.authService.getLoginUrl()
      return {
        url: loginUrl
      };
    }
  }

  @Post('callback/:request_token')
  async callback(@Param('request_token') request_token: string) {
    await this.authService.generateSession(request_token);
    return "app is authenticated"
  }

  @Post('refresh')
  async refresh() {
    await this.authService.refresh();
    return "access token refreshed"
  }

  @Post('logout')
  async logout() {
    await this.authService.logout()
  }
}
