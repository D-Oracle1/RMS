import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RankingService } from './ranking.service';
import { StaffRankingService } from './staff-ranking.service';
import { ClientRankingService } from './client-ranking.service';
import { RankingController } from './ranking.controller';

@Module({
  imports: [...(process.env.VERCEL ? [] : [ScheduleModule.forRoot()])],
  controllers: [RankingController],
  providers: [RankingService, StaffRankingService, ClientRankingService],
  exports: [RankingService, StaffRankingService, ClientRankingService],
})
export class RankingModule {}
