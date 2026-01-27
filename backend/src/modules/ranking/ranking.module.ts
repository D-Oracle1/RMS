import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [RankingController],
  providers: [RankingService],
  exports: [RankingService],
})
export class RankingModule {}
