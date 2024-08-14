import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from './token.service';

@Injectable()
export class AccessGuard implements CanActivate {
    constructor(
        private readonly tokenService: TokenService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const accessToken = request.cookies['accessToken'];

        if (!accessToken) {
            throw new UnauthorizedException('Access token is missing.');
        }

        try {
            const decoded = await this.tokenService.isValid(accessToken);
            request.user = decoded;
            return true;
        } catch (error) {
            response.clearCookie('accessToken');
            console.log(error)
            throw new UnauthorizedException('Invalid access token.');
        }
    }
}

@Injectable()
export class RefreshGuard implements CanActivate {
    constructor(
        private readonly tokenService: TokenService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const refreshToken = request.cookies['refreshToken'];

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is missing.');
        }

        try {
            await this.tokenService.isValid(refreshToken);
            return true;
        } catch (error) {
            response.clearCookie('refreshToken');
            console.log(error)
            throw new UnauthorizedException('Invalid refresh token.');
        }
    }
}
