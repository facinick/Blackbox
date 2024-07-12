import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiModule } from 'src/api/api.module';
import { AuthController } from './auth.controller';
import { TokenService } from './token.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [ApiModule, PrismaModule],
  providers: [AuthService, TokenService],
  exports: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
