import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TokenService {

    private requestToken: string;

    constructor(private readonly prismaService: PrismaService) { }

    async saveAccessToken(token: string): Promise<void> {
        await this.prismaService.token.upsert({
            where: { requestToken: this.requestToken },
            update: { accessToken: token },
            create: { accessToken: token, requestToken: this.requestToken, refreshToken: null },
        });
    }

    async saveRefreshToken(token: string): Promise<void> {
        await this.prismaService.token.upsert({
            where: { requestToken: this.requestToken },
            update: { refreshToken: token },
            create: { refreshToken: token, requestToken: this.requestToken, accessToken: null },
        });
    }

    async saveRequestToken(token: string): Promise<void> {
        await this.clearTokens()
        this.requestToken = token;
        await this.prismaService.token.create(
            {
                data: {
                    requestToken: this.requestToken,
                    accessToken: null,
                    refreshToken: null
                }
            }
        );
    }

    async getAccessToken(): Promise<string> {
        const token = await this.prismaService.token.findUnique({
            where: { requestToken: this.requestToken },
        });
        return token?.accessToken || null;
    }

    async getRefreshToken(): Promise<string> {
        const token = await this.prismaService.token.findUnique({
            where: { requestToken: this.requestToken },
        });
        return token?.refreshToken || null;
    }

    async getRequestToken(): Promise<string> {
        const token = await this.prismaService.token.findFirst();
        return token?.requestToken || null;
    }

    async clearTokens(): Promise<void> {
        await this.prismaService.token.deleteMany();
        this.requestToken = null;
    }
}
