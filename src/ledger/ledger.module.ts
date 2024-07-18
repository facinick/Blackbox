import { Module } from '@nestjs/common';
import { LedgersService } from './ledger.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LedgerLocalStore } from './storage/local/ledger.local.store';
import { LEDGER_STORE_PORT } from './ledger.store.port';

@Module({
  imports: [PrismaModule],
  providers: [
    LedgersService,
    {
      useClass: LedgerLocalStore,
      provide: LEDGER_STORE_PORT,
    },
  ],
  exports: [LedgersService],
})
export class LedgerModule {}
