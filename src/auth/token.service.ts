import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(private readonly prismaService: PrismaService) {}

  async upsertAccessToken(userId: string, accessToken: string): Promise<void> {
    await this.prismaService.authToken.upsert({
      where: { userId },
      update: { accessToken },
      create: {
        accessToken,
        user: { connect: { id: userId } },
      },
    });
  }

  async getAccessToken(userId: string): Promise<string | null> {
    const token = await this.prismaService.authToken.findFirst({
      where: { userId },
    });
    return token?.accessToken ?? null;
  }

  async clearTokens(userId: string): Promise<void> {
    await this.prismaService.authToken.deleteMany({
      where: { userId },
    });
  }
}
