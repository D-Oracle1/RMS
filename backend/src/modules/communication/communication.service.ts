import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSubscriberDto,
  UpdateSubscriberDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateTemplateDto,
  CampaignQueryDto,
  SubscriberQueryDto,
} from './dto';
import { CampaignStatus } from './enums';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // SUBSCRIBER CRUD
  // ============================================================

  async createSubscriber(dto: CreateSubscriberDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.prisma.emailSubscriber.findFirst({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.isSubscribed) {
        return { message: 'You are already subscribed!' };
      }
      // Re-subscribe
      await this.prisma.emailSubscriber.update({
        where: { id: existing.id },
        data: { isSubscribed: true, fullName: dto.fullName || existing.fullName },
      });
      return { message: 'Welcome back! Your subscription has been reactivated.' };
    }

    await this.prisma.emailSubscriber.create({
      data: {
        email: normalizedEmail,
        fullName: dto.fullName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        role: dto.role,
      },
    });

    return { message: 'Successfully subscribed!' };
  }

  async getSubscribers(query: SubscriberQueryDto) {
    const { page = 1, limit = 20, search, role, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === 'active') where.isSubscribed = true;
    else if (status === 'unsubscribed') where.isSubscribed = false;

    if (role) where.role = role;

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subscribers, total] = await Promise.all([
      this.prisma.emailSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailSubscriber.count({ where }),
    ]);

    return {
      data: subscribers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSubscriber(id: string) {
    const subscriber = await this.prisma.emailSubscriber.findUnique({
      where: { id },
      include: {
        campaignLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { campaign: { select: { title: true, campaignType: true } } },
        },
      },
    });

    if (!subscriber) throw new NotFoundException('Subscriber not found');
    return subscriber;
  }

  async updateSubscriber(id: string, dto: UpdateSubscriberDto) {
    const subscriber = await this.prisma.emailSubscriber.findUnique({ where: { id } });
    if (!subscriber) throw new NotFoundException('Subscriber not found');

    return this.prisma.emailSubscriber.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        role: dto.role,
        isSubscribed: dto.isSubscribed,
      },
    });
  }

  async deleteSubscriber(id: string) {
    const subscriber = await this.prisma.emailSubscriber.findUnique({ where: { id } });
    if (!subscriber) throw new NotFoundException('Subscriber not found');

    await this.prisma.emailSubscriber.delete({ where: { id } });
    return { message: 'Subscriber deleted' };
  }

  // ============================================================
  // CAMPAIGN CRUD
  // ============================================================

  async createCampaign(dto: CreateCampaignDto, createdBy: string) {
    const campaign = await this.prisma.campaign.create({
      data: {
        title: dto.title,
        campaignType: dto.campaignType,
        audienceType: dto.audienceType,
        scheduleType: dto.scheduleType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        recurrenceRule: dto.recurrenceRule,
        tone: dto.tone,
        htmlContent: dto.htmlContent,
        subject: dto.subject,
        createdBy,
      },
    });

    this.logger.log(`Campaign created: ${campaign.title} by ${createdBy}`);
    return campaign;
  }

  async getCampaigns(query: CampaignQueryDto) {
    const { page = 1, limit = 20, campaignType, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (campaignType) where.campaignType = campaignType;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { logs: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: { select: { logs: true } },
        logs: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { subscriber: { select: { email: true, fullName: true } } },
        },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.campaign.update({
      where: { id },
      data: {
        title: dto.title,
        audienceType: dto.audienceType,
        tone: dto.tone,
        htmlContent: dto.htmlContent,
        subject: dto.subject,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        recurrenceRule: dto.recurrenceRule,
      },
    });
  }

  async deleteCampaign(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.prisma.campaign.delete({ where: { id } });
    return { message: 'Campaign deleted' };
  }

  async updateCampaignStatus(id: string, status: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.campaign.update({
      where: { id },
      data: { status: status as CampaignStatus },
    });
  }

  // ============================================================
  // AI CONTENT TEMPLATES
  // ============================================================

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.aIContentTemplate.create({
      data: {
        templateName: dto.templateName,
        promptTemplate: dto.promptTemplate,
        tone: dto.tone,
      },
    });
  }

  async getTemplates() {
    return this.prisma.aIContentTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.aIContentTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    await this.prisma.aIContentTemplate.delete({ where: { id } });
    return { message: 'Template deleted' };
  }
}
