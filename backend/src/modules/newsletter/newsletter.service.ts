import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../common/services/mail.service';
import { QueueService } from '../../common/services/queue.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {}

  async subscribe(email: string, name?: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.isActive) {
        return { message: 'You are already subscribed!' };
      }
      // Reactivate
      await this.prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { isActive: true, unsubscribedAt: null, name: name || existing.name },
      });
      return { message: 'Welcome back! Your subscription has been reactivated.' };
    }

    await this.prisma.newsletterSubscriber.create({
      data: { email: normalizedEmail, name },
    });

    return { message: 'Successfully subscribed to our newsletter!' };
  }

  async unsubscribe(token: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      throw new NotFoundException('Invalid unsubscribe link.');
    }

    if (!subscriber.isActive) {
      return { message: 'You are already unsubscribed.' };
    }

    await this.prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { isActive: false, unsubscribedAt: new Date() },
    });

    return { message: 'You have been successfully unsubscribed.' };
  }

  async getSubscribers(query: { page?: number; limit?: number; search?: string; status?: string }) {
    const { page = 1, limit = 20, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === 'active') where.isActive = true;
    else if (status === 'unsubscribed') where.isActive = false;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subscribers, total] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { subscribedAt: 'desc' },
      }),
      this.prisma.newsletterSubscriber.count({ where }),
    ]);

    return {
      data: subscribers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getStats() {
    const [total, active, unsubscribed] = await Promise.all([
      this.prisma.newsletterSubscriber.count(),
      this.prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.newsletterSubscriber.count({ where: { isActive: false } }),
    ]);

    return { total, active, unsubscribed };
  }

  async deleteSubscriber(id: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!subscriber) throw new NotFoundException('Subscriber not found');

    await this.prisma.newsletterSubscriber.delete({ where: { id } });
    return { message: 'Subscriber deleted' };
  }

  async sendBulkEmail(subject: string, content: string) {
    const subscribers = await this.prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, unsubscribeToken: true },
    });

    if (subscribers.length === 0) {
      return { message: 'No active subscribers to send to', sent: 0 };
    }

    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000').trim();
    const apiUrl = (this.configService.get<string>('API_URL') || 'http://localhost:4000').trim();

    let queued = 0;
    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${apiUrl}/api/v1/newsletter/unsubscribe/${subscriber.unsubscribeToken}`;
      try {
        await this.queueService.addEmailJob({
          type: 'newsletter',
          to: subscriber.email,
          data: { subject, content, unsubscribeUrl },
        });
        queued++;
      } catch (error) {
        this.logger.error(`Failed to queue newsletter for ${subscriber.email}: ${error.message}`);
      }
    }

    this.logger.log(`Newsletter "${subject}" queued for ${queued}/${subscribers.length} subscribers`);
    return { message: `Newsletter queued for ${queued} subscribers`, sent: queued };
  }
}
