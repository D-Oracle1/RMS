import { Module } from '@nestjs/common';
import { CallController } from './call.controller';
import { PushNotificationService } from '../../common/services/push-notification.service';

@Module({
  controllers: [CallController],
  providers: [PushNotificationService],
})
export class CallModule {}
