import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { ApiModule } from 'src/api/api.module';

@Module({
  imports: [ApiModule],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
