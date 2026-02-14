import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { MailService } from '../../common/services/mail.service';
import { QueueService } from '../../common/services/queue.service';

@Module({
  controllers: [NewsletterController],
  providers: [NewsletterService, MailService, QueueService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
