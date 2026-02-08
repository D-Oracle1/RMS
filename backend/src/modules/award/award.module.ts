import { Module, forwardRef } from '@nestjs/common';
import { AwardService } from './award.service';
import { AwardController } from './award.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [AwardController],
  providers: [AwardService],
  exports: [AwardService],
})
export class AwardModule {}
