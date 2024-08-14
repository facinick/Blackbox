import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AppLogger } from "src/logger/logger.service";
import { AuthPayload } from "./auth";

@Injectable()
class TokenService {

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly logger: AppLogger) {
        this.logger.setContext(this.constructor.name)
    }

    generateTokens = async (userId: number): Promise<{
        refreshToken: string
        accessToken: string
    }> => {

        try {

            const payload: AuthPayload = { sub: String(userId) };

            const accessTokenExpiresIn = parseInt(this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN_SEC'))
            const refreshTokenExpiresIn = parseInt(this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN_SEC'))
            const jwtSecret = this.configService.get<string>(`JWT_SECRET`)

            const [accessToken, refreshToken] = await Promise.all([
                this.jwtService.signAsync(payload, {
                    expiresIn: accessTokenExpiresIn,
                    secret: jwtSecret
                }),
                this.jwtService.signAsync(payload, {
                    expiresIn: refreshTokenExpiresIn,
                    secret: jwtSecret
                }),
            ])

            return {
                accessToken,
                refreshToken
            }
        }

        catch (error) {
            this.logger.error(`Failed generating tokens:`, error)
            throw error
        }
    }

    generateAccessToken = async (userId: number): Promise<{
        accessToken: string
    }> => {

        try {
            const payload: AuthPayload = { sub: String(userId) };

            const accessTokenExpiresIn = parseInt(this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN_SEC'))
            const jwtSecret = this.configService.get<string>(`JWT_SECRET`)

            const accessToken = await this.jwtService.signAsync(payload, {
                expiresIn: accessTokenExpiresIn,
                secret: jwtSecret,
            })

            return {
                accessToken,
            }
        }

        catch (error) {
            this.logger.error(`Failed generating accessToken:`, error)
            throw error
        }
    }

    isValid = async (token: string) => {
        const decoded = await this.jwtService.verify<AuthPayload>(token, {
            secret: this.configService.get(`JWT_SECRET`)
        })
        return decoded
    }

    getTokenPayload = (token: string) => {
        const decoded = this.jwtService.decode<AuthPayload>(token)
        return decoded
    }
}

export {
    TokenService
}