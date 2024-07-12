import { Module } from '@nestjs/common';
import { LedgersService } from './ledger.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LedgersService],
  exports: [LedgersService],
})
export class LedgerModule {}
