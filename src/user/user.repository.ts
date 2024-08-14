import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { AppLogger } from "src/logger/logger.service";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UserRepository {

    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: AppLogger) {
        this.logger.setContext(this.constructor.name)
    }

    // todo: mapper for repository, rn returning db entitiy
    findUserByZerodhaId = async (zerodhaUserId: string): Promise<User | null> => {
        try {
            const user = this.prisma.user.findFirst({
                where: {
                    zerodhaAccount: {
                        zerodhaUserId
                    }
                }
            })
            return user;
        } catch (error) {
            // Handle error (e.g., log it)
            console.error('Error finding user by Zerodha ID:', error);
            return null; // Return null if an error occurs
        }
    }
}