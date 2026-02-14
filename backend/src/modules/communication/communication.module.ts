import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { AiMessagingService } from './ai-messaging.service';
import { CampaignEmailService } from './campaign-email.service';
import { CampaignSchedulerService } from './scheduler.service';
import { PopupNotificationService } from './notification.service';
import { CampaignAnalyticsService } from './analytics.service';
import { MailService } from '../../common/services/mail.service';

@Module({
  controllers: [CommunicationController],
  providers: [
    CommunicationService,
    AiMessagingService,
    CampaignEmailService,
    CampaignSchedulerService,
    PopupNotificationService,
    CampaignAnalyticsService,
    MailService,
  ],
  exports: [
    CommunicationService,
    CampaignEmailService,
    CampaignSchedulerService,
    PopupNotificationService,
  ],
})
export class CommunicationModule {}
