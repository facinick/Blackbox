import { BadRequestException, Controller, Get, Post, Query, Redirect, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common'
import { AppLogger } from 'src/logger/logger.service'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { ConfigService } from '@nestjs/config'
import { KiteConnect } from 'kiteconnect'
import { AccessGuard, RefreshGuard } from './auth.guard'
import { ACCESS_TOKEN_COOKIE_KEY, JWT_COOKIE_SETTINGS, REFRESH_TOKEN_COOKIE_KEY } from './constants'
import { CurrentUser } from './current-user.decorator'
import { AuthPayload } from './auth'

@Controller('auth')
export class AuthController {

    private readonly kc: KiteConnect

    constructor(
        private readonly logger: AppLogger,
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        this.logger.setContext(this.constructor.name)
        const apiKey = this.configService.get<string>('ZERODHA_API_KEY')
        if (!apiKey) {
            throw new Error(`No API Key found to initialize Zerodha API`)
        }
        this.kc = new KiteConnect({
            api_key: apiKey,
        })
    }

    @UseGuards(RefreshGuard)
    @Post('logout')
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response) {

        const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_KEY];
        // maybe black list this in future
        const accessToken = request.cookies[ACCESS_TOKEN_COOKIE_KEY];

        try {
            await this.authService.logout(refreshToken);
        } catch (error) {
            console.error('Error during logout process:', error);
            throw new UnauthorizedException('Failed to logout. Please try again.');
        }

        response.clearCookie(REFRESH_TOKEN_COOKIE_KEY, JWT_COOKIE_SETTINGS);
        response.clearCookie(ACCESS_TOKEN_COOKIE_KEY, JWT_COOKIE_SETTINGS);

        return { message: 'Logout successful' };
    }

    @UseGuards(RefreshGuard)
    @Post('logout-all')
    async logoutAll(
        @Req() request: Request,
        @CurrentUser() currentUser: AuthPayload,
        @Res({ passthrough: true }) response: Response) {

        // maybe black list this in future
        const accessToken = request.cookies[ACCESS_TOKEN_COOKIE_KEY];

        try {
            await this.authService.logoutAll(Number(currentUser.sub));
        } catch (error) {
            console.error('Error during logout process:', error);
            throw new UnauthorizedException('Failed to logout. Please try again.');
        }

        response.clearCookie(REFRESH_TOKEN_COOKIE_KEY, JWT_COOKIE_SETTINGS);
        response.clearCookie(ACCESS_TOKEN_COOKIE_KEY, JWT_COOKIE_SETTINGS);

        return { message: 'Logout successful' };
    }

    // input: VALID refreshToken of the user via cookie
    // output: accessToken in response body
    @UseGuards(RefreshGuard)
    @Post('refresh')
    async refresh(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response) {

        const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_KEY]

        const { accessToken } = await this.authService.refreshAccessToken(refreshToken)

        response.cookie(ACCESS_TOKEN_COOKIE_KEY, accessToken, JWT_COOKIE_SETTINGS)

        return { message: 'Refresh successful' };
    }

    @Get('login/zerodha')
    async loginWithZerodha() {
        const loginUrl = await this.kc.getLoginURL()
        return { url: loginUrl };
    }

    // input: request_token in query params
    // output: accessToken in response body
    // output: refreshToken in cookie (secure, HttpOnly, SameSite)
    @Get('callback/zerodha')
    async zerodhaCallback(
        @Query('request_token') requestToken: string,
        @Res({ passthrough: true }) response: Response) {

        if (!requestToken) {
            this.logger.warn('Zerodha callback attempted without request token.');
            throw new BadRequestException('No request token provided.');
        }

        const { accessToken, refreshToken } = await this.authService.handleZerodhaCallback(requestToken)

        response.cookie(ACCESS_TOKEN_COOKIE_KEY, accessToken, JWT_COOKIE_SETTINGS)
        response.cookie(REFRESH_TOKEN_COOKIE_KEY, refreshToken, JWT_COOKIE_SETTINGS)

        const postLoginRedirectUrl = this.configService.get<string>('POST_LOGIN_REDIRECT_WEB_URL')

        return response.redirect(postLoginRedirectUrl)
    }

    @Get('status')
    async authStatus(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response
    ) {
        const accessToken = request.cookies[ACCESS_TOKEN_COOKIE_KEY];

        // todo: remove
        console.log({
            accessToken
        })

        if (!accessToken) {
            return { isAuthenticated: false };
        }

        try {
            const decoded = await this.authService.validateAccessToken(accessToken);
            // todo: remove
            console.log({
                currentTime: Date.now(),
                expiry: decoded.exp * 1000,
                decoded
            })
            return { isAuthenticated: true };
        } catch (error) {
            console.log(error)
            response.clearCookie('accessToken')
            return { isAuthenticated: false };
        }
    }
}
