import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { Queue, Worker, Job } from 'bullmq';
import { CampaignEmailService } from './campaign-email.service';
import { AiMessagingService } from './ai-messaging.service';
import { CampaignStatus, CampaignType, ScheduleType } from './enums';

export interface CampaignJob {
  campaignId: string;
  type: 'send_campaign' | 'send_birthday' | 'process_recurring';
}

@Injectable()
export class CampaignSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignSchedulerService.name);
  private campaignQueue: Queue | null = null;
  private campaignWorker: Worker | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly campaignEmailService: CampaignEmailService,
    private readonly aiMessagingService: AiMessagingService,
  ) {}

  onModuleInit() {
    // Skip queue initialization in serverless environments
    if (process.env.VERCEL) {
      this.logger.log('Serverless environment detected — campaign scheduler using HTTP triggers only');
      return;
    }

    const connection = {
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password') || undefined,
    };

    try {
      this.campaignQueue = new Queue('campaigns', { connection });

      this.campaignWorker = new Worker(
        'campaigns',
        async (job: Job<CampaignJob>) => {
          await this.processJob(job.data);
        },
        {
          connection,
          concurrency: 3,
        },
      );

      this.campaignWorker.on('completed', (job) => {
        this.logger.log(`Campaign job ${job.id} completed`);
      });

      this.campaignWorker.on('failed', (job, err) => {
        this.logger.error(`Campaign job ${job?.id} failed: ${err.message}`);
      });

      this.logger.log('Campaign scheduler queue initialized');
    } catch (error) {
      this.logger.warn(`Campaign queue init failed: ${error.message}. Running synchronously.`);
    }
  }

  onModuleDestroy() {
    this.campaignWorker?.close();
    this.campaignQueue?.close();
  }

  /**
   * Scan for ACTIVE campaigns that are due and enqueue them.
   * Called by cron job (e.g., every minute) or HTTP trigger.
   */
  async scanAndEnqueue(): Promise<{ enqueued: number }> {
    const now = new Date();
    let enqueued = 0;

    // 1. Scheduled campaigns that are due
    const scheduledCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        scheduleType: ScheduleType.SCHEDULED,
        scheduledAt: { lte: now },
      },
    });

    for (const campaign of scheduledCampaigns) {
      await this.addJob({ campaignId: campaign.id, type: 'send_campaign' });
      enqueued++;
    }

    // 2. Immediate campaigns (ACTIVE but not yet processed)
    const immediateCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        scheduleType: ScheduleType.IMMEDIATE,
      },
    });

    for (const campaign of immediateCampaigns) {
      await this.addJob({ campaignId: campaign.id, type: 'send_campaign' });
      enqueued++;
    }

    // 3. Recurring campaigns — check if due based on recurrence rule
    const recurringCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        scheduleType: ScheduleType.RECURRING,
        recurrenceRule: { not: null },
      },
    });

    for (const campaign of recurringCampaigns) {
      if (this.isRecurringDue(campaign.recurrenceRule!, campaign.completedAt)) {
        await this.addJob({ campaignId: campaign.id, type: 'process_recurring' });
        enqueued++;
      }
    }

    if (enqueued > 0) {
      this.logger.log(`Enqueued ${enqueued} campaigns for processing`);
    }

    return { enqueued };
  }

  /**
   * Scan for birthday subscribers and trigger birthday campaign.
   * Called daily by cron.
   */
  async processBirthdays(): Promise<{ sent: number }> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find subscribers whose birthday is today
    const subscribers = await this.prisma.$queryRawUnsafe<Array<{ id: string; email: string; fullName: string }>>(
      `SELECT id, email, "fullName" FROM email_subscribers
       WHERE "isSubscribed" = true
       AND EXTRACT(MONTH FROM "dateOfBirth") = $1
       AND EXTRACT(DAY FROM "dateOfBirth") = $2`,
      month,
      day,
    );

    if (subscribers.length === 0) {
      this.logger.debug('No birthdays today');
      return { sent: 0 };
    }

    this.logger.log(`Found ${subscribers.length} birthday(s) today`);

    let sent = 0;
    for (const subscriber of subscribers) {
      try {
        const content = await this.aiMessagingService.generateBirthdayMessage({
          tone: 'FRIENDLY' as any,
          recipientName: subscriber.fullName || 'Valued Client',
        });

        // Create a one-off birthday campaign
        const campaign = await this.prisma.campaign.create({
          data: {
            title: `Birthday - ${subscriber.fullName || subscriber.email}`,
            campaignType: CampaignType.BIRTHDAY,
            scheduleType: ScheduleType.IMMEDIATE,
            status: CampaignStatus.ACTIVE,
            subject: content.subject,
            htmlContent: content.htmlContent,
            promptUsed: content.promptUsed,
            createdBy: 'system',
          },
        });

        const result = await this.campaignEmailService.sendToSubscriber(campaign.id, subscriber.id);
        if (result) sent++;

        // Mark campaign as completed
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: CampaignStatus.COMPLETED, completedAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Failed to send birthday email to ${subscriber.email}: ${error.message}`);
      }
    }

    return { sent };
  }

  /**
   * Manually trigger a campaign to be sent immediately.
   */
  async triggerCampaign(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    // Generate AI content if not already present
    if (!campaign.htmlContent) {
      const content = await this.generateCampaignContent(campaign);
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          subject: content.subject,
          htmlContent: content.htmlContent,
          promptUsed: content.promptUsed,
          status: CampaignStatus.ACTIVE,
        },
      });
    } else if (campaign.status === CampaignStatus.DRAFT) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.ACTIVE },
      });
    }

    await this.addJob({ campaignId, type: 'send_campaign' });
  }

  /**
   * Get queue stats for monitoring.
   */
  async getQueueStats() {
    if (!this.campaignQueue) return null;

    return {
      waiting: await this.campaignQueue.getWaitingCount(),
      active: await this.campaignQueue.getActiveCount(),
      completed: await this.campaignQueue.getCompletedCount(),
      failed: await this.campaignQueue.getFailedCount(),
    };
  }

  // ==============================
  // Private Methods
  // ==============================

  private async addJob(data: CampaignJob): Promise<void> {
    if (this.campaignQueue) {
      await this.campaignQueue.add('process-campaign', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      });
    } else {
      // Fallback: process synchronously
      await this.processJob(data);
    }
  }

  private async processJob(data: CampaignJob): Promise<void> {
    switch (data.type) {
      case 'send_campaign':
        await this.campaignEmailService.sendCampaignToAudience(data.campaignId);
        break;

      case 'send_birthday':
        await this.processBirthdays();
        break;

      case 'process_recurring':
        await this.processRecurringCampaign(data.campaignId);
        break;

      default:
        this.logger.warn(`Unknown campaign job type: ${data.type}`);
    }
  }

  private async processRecurringCampaign(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return;

    // Regenerate content for recurring campaigns
    const content = await this.generateCampaignContent(campaign);
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        subject: content.subject,
        htmlContent: content.htmlContent,
        promptUsed: content.promptUsed,
      },
    });

    await this.campaignEmailService.sendCampaignToAudience(campaignId);

    // Reset status back to ACTIVE for next recurrence (don't mark COMPLETED)
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.ACTIVE, completedAt: new Date() },
    });
  }

  private async generateCampaignContent(campaign: any) {
    const tone = campaign.tone || 'PROFESSIONAL';

    switch (campaign.campaignType) {
      case CampaignType.NEWSLETTER:
        return this.aiMessagingService.generateNewsletterContent({ tone });

      case CampaignType.PROPERTY_ALERT:
        return this.aiMessagingService.generatePropertyAlert({
          tone,
          properties: [],
        });

      case CampaignType.CUSTOM:
        return this.aiMessagingService.generateCustomCampaign({
          tone,
          prompt: campaign.title,
          context: campaign.promptUsed,
        });

      default:
        return this.aiMessagingService.generateNewsletterContent({ tone });
    }
  }

  /**
   * Simple recurring check: compare completedAt with a basic interval.
   * Supports simple cron-like patterns: 'daily', 'weekly', 'monthly'
   * or numeric interval in hours (e.g., '24' for daily).
   */
  private isRecurringDue(recurrenceRule: string, lastCompletedAt: Date | null): boolean {
    if (!lastCompletedAt) return true; // Never run before

    const now = Date.now();
    const lastRun = lastCompletedAt.getTime();
    const hoursSinceLastRun = (now - lastRun) / (1000 * 60 * 60);

    switch (recurrenceRule.toLowerCase()) {
      case 'daily':
        return hoursSinceLastRun >= 24;
      case 'weekly':
        return hoursSinceLastRun >= 168;
      case 'monthly':
        return hoursSinceLastRun >= 720;
      default: {
        const hours = parseInt(recurrenceRule, 10);
        if (!isNaN(hours) && hours > 0) {
          return hoursSinceLastRun >= hours;
        }
        return false;
      }
    }
  }
}
