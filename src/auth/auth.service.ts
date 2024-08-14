import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { KiteConnect } from 'kiteconnect'
import { AppLogger } from 'src/logger/logger.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { TokenService } from './token.service'
import { User } from '@prisma/client'
import { API_SERVICE, ApiService } from 'src/api/api.service'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class AuthService {

  public static Events = {
    NewSessionGenerated: "session.new"
  }

  constructor(
    @Inject(API_SERVICE)
    private readonly apiService: ApiService,
    private readonly logger: AppLogger,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly tokensService: TokenService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(this.constructor.name)
    const apiKey = configService.get('ZERODHA_API_KEY')
    if (!apiKey) {
      throw new Error(`No API Key found to initialize Zerodha API`)
    }
    this.apiService.initialize(apiKey)
  }

  handleZerodhaCallback = async (zerodhaRequestToken: string): Promise<{
    accessToken: string
    refreshToken: string
  }> => {

    const apiSecret = this.configService.get('ZERODHA_API_SECRET');

    if (!apiSecret) {
      throw new Error('No API Secret found to generate Zerodha session');
    }

    // Generate a session from Zerodha
    const session = await this.apiService.generateSession(zerodhaRequestToken, apiSecret);
    // only when api service is initialized we can log user is
    this.logger.log('New session generated:', session);

    // Check if the user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        zerodhaAccount: {
          zerodhaUserId: session.userId,
        },
      },
    });

    let user: User;

    if (existingUser) {
      // Update existing user's Zerodha account details
      user = await this.prisma.zerodhaAccount.update({
        where: {
          userId: existingUser.id,
        },
        data: {
          zerodhaAccessToken: session.accessToken,
          zerodhaRefreshToken: session.refreshToken,
          tokenExpiry: new Date(),
        },
      });
    } else {
      // Create a new user and associated Zerodha account
      user = await this.prisma.user.create({
        data: {
          zerodhaAccount: {
            create: {
              zerodhaUserId: session.userId,
              zerodhaAccessToken: session.accessToken,
              zerodhaRefreshToken: session.refreshToken,
              tokenExpiry: new Date(),
            },
          },
        },
      });
    }

    const { accessToken, refreshToken } = await this.tokensService.generateTokens(user.id)

    const refreshTokenExpiryInSeconds = this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRES_IN_SEC');

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiry: new Date(Date.now() + refreshTokenExpiryInSeconds * 1000),
        userId: user.id
      },
    })

    this.apiService.setSessionExpiryHook(() => {
      this.logoutAll(user.id)
    })

    this.eventEmitter.emit(AuthService.Events.NewSessionGenerated)

    return { accessToken, refreshToken };
  }

  logout = async (refreshToken: string): Promise<void> => {
    try {
      await this.tokensService.isValid(refreshToken)

      await this.prisma.refreshToken.delete({
        where: {
          token: refreshToken
        }
      })

      return
    } catch (error) {
      this.logger.error(`error deleting token`, error)
      throw new Error(error)
    }
  }

  logoutAll = async (userId: number): Promise<void> => {
    try {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId
        }
      })

      return
    } catch (error) {
      this.logger.error(`error deleting tokens`, error)
      throw new Error(error)
    }
  }

  refresh = async (_refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
  }> => {
    try {
      const decoded = await this.tokensService.isValid(_refreshToken)

      const { accessToken, refreshToken } = await this.tokensService.generateTokens(Number(decoded.sub))

      const refreshTokenExpiryInSeconds = this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRES_IN_SEC');

      await this.prisma.refreshToken.update({
        data: {
          token: refreshToken,
          expiry: new Date(Date.now() + refreshTokenExpiryInSeconds * 1000),
        },
        where: {
          token: _refreshToken
        }
      })

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`error refreshing token`, error)
      throw new Error(error)
    }
  }

  refreshAccessToken = async (_refreshToken: string): Promise<{
    accessToken: string
  }> => {
    try {
      const decoded = await this.tokensService.isValid(_refreshToken)

      const { accessToken } = await this.tokensService.generateAccessToken(Number(decoded.sub))

      return { accessToken };
    } catch (error) {
      this.logger.error(`error refreshing token`, error)
      throw new Error(error)
    }
  }

  validateAccessToken = async (accessToken: string) => {
    return this.tokensService.isValid(accessToken)
  }
}
