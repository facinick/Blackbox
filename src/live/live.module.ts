import { Module } from '@nestjs/common';
import { LiveService } from './live.service';
import { ApiModule } from 'src/api/api.module';

@Module({
  imports: [ApiModule],
  providers: [LiveService],
  exports: [LiveService],
})
export class LiveModule {}
