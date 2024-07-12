import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TokenService {

    private requestToken: string;

    constructor(private readonly prismaService: PrismaService) {}

    saveAccessToken = async (token: string): Promise<void> => {
        await this.prismaService.token.update({
            where: { requestToken: this.requestToken },
            data: { accessToken: token },
        });
    }

    saveRefreshToken = async (token: string): Promise<void> => {
        await this.prismaService.token.update({
            where: { requestToken: this.requestToken },
            data: { refreshToken: token },
        });
    }

    saveRequestToken = async (token: string): Promise<void> => {
        this.requestToken = token;
        await this.prismaService.token.create({
            data: {
                requestToken: this.requestToken,
                accessToken: null,
                refreshToken: null
            }
        });
    }

    getAccessToken = async (): Promise<string> => {
        const token = await this.prismaService.token.findUnique({
            where: { requestToken: this.requestToken },
        });
        return token?.accessToken || null;
    }

    getRefreshToken = async (): Promise<string> => {
        const token = await this.prismaService.token.findUnique({
            where: { requestToken: this.requestToken },
        });
        return token?.refreshToken || null;
    }

    getRequestToken = async (): Promise<string> => {
        const token = await this.prismaService.token.findFirst();
        return token?.requestToken || null;
    }

    clearTokens = async (): Promise<void> => {
        console.log(`clearing all tokens`)
        await this.prismaService.token.deleteMany({});
        this.requestToken = null;
    }
}
