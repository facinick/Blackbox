import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { TokenService } from './token.service'
import { JwtService } from '@nestjs/jwt'
import { AccessGuard, RefreshGuard } from './auth.guard'

@Module({
  providers: [AuthService, TokenService, JwtService, AccessGuard, RefreshGuard],
  exports: [AuthService, TokenService, AccessGuard, RefreshGuard],
  controllers: [AuthController],
})
export class AuthModule {}
