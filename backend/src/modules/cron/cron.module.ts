import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { RankingModule } from '../ranking/ranking.module';
import { SaleModule } from '../sale/sale.module';

@Module({
  imports: [RankingModule, SaleModule],
  controllers: [CronController],
})
export class CronModule {}
