import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CampaignLogStatus } from './enums';

@Injectable()
export class CampaignAnalyticsService {
  private readonly logger = new Logger(CampaignAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get analytics for a specific campaign.
   */
  async getCampaignAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, campaignType: true, status: true, createdAt: true, completedAt: true },
    });

    if (!campaign) return null;

    const logs = await this.prisma.campaignLog.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: { id: true },
    });

    const statusMap: Record<string, number> = {};
    let total = 0;
    for (const log of logs) {
      statusMap[log.status] = log._count.id;
      total += log._count.id;
    }

    const sent = (statusMap[CampaignLogStatus.SENT] || 0) +
                 (statusMap[CampaignLogStatus.OPENED] || 0) +
                 (statusMap[CampaignLogStatus.CLICKED] || 0);
    const opened = (statusMap[CampaignLogStatus.OPENED] || 0) +
                   (statusMap[CampaignLogStatus.CLICKED] || 0);
    const clicked = statusMap[CampaignLogStatus.CLICKED] || 0;
    const failed = statusMap[CampaignLogStatus.FAILED] || 0;

    return {
      campaign,
      metrics: {
        totalRecipients: total,
        sent,
        opened,
        clicked,
        failed,
        pending: statusMap[CampaignLogStatus.PENDING] || 0,
        openRate: sent > 0 ? Math.round((opened / sent) * 10000) / 100 : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 10000) / 100 : 0,
        failureRate: total > 0 ? Math.round((failed / total) * 10000) / 100 : 0,
      },
    };
  }

  /**
   * Get overall communication dashboard stats.
   */
  async getDashboardStats(tenantId?: string) {
    const tenantFilter = tenantId ? { tenantId } : {};

    const [
      totalSubscribers,
      activeSubscribers,
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
    ] = await Promise.all([
      this.prisma.emailSubscriber.count({ where: tenantFilter }),
      this.prisma.emailSubscriber.count({ where: { ...tenantFilter, isSubscribed: true } }),
      this.prisma.campaign.count({ where: tenantFilter }),
      this.prisma.campaign.count({ where: { ...tenantFilter, status: 'ACTIVE' } }),
      this.prisma.campaign.count({ where: { ...tenantFilter, status: 'COMPLETED' } }),
    ]);

    // Aggregate email stats
    const emailStats = await this.prisma.campaignLog.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const emailStatusMap: Record<string, number> = {};
    let totalEmails = 0;
    for (const stat of emailStats) {
      emailStatusMap[stat.status] = stat._count.id;
      totalEmails += stat._count.id;
    }

    const totalSent = (emailStatusMap[CampaignLogStatus.SENT] || 0) +
                      (emailStatusMap[CampaignLogStatus.OPENED] || 0) +
                      (emailStatusMap[CampaignLogStatus.CLICKED] || 0);
    const totalOpened = (emailStatusMap[CampaignLogStatus.OPENED] || 0) +
                        (emailStatusMap[CampaignLogStatus.CLICKED] || 0);
    const totalClicked = emailStatusMap[CampaignLogStatus.CLICKED] || 0;

    return {
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        unsubscribed: totalSubscribers - activeSubscribers,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        completed: completedCampaigns,
        draft: totalCampaigns - activeCampaigns - completedCampaigns,
      },
      emails: {
        total: totalEmails,
        sent: totalSent,
        opened: totalOpened,
        clicked: totalClicked,
        failed: emailStatusMap[CampaignLogStatus.FAILED] || 0,
        overallOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 10000) / 100 : 0,
        overallClickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 10000) / 100 : 0,
      },
    };
  }

  /**
   * Get campaign performance ranking (top campaigns by engagement).
   */
  async getCampaignRanking(limit = 10) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { status: 'COMPLETED' },
      select: { id: true, title: true, campaignType: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
      take: limit * 2, // Fetch more to rank properly
    });

    const rankings = [];

    for (const campaign of campaigns) {
      const stats = await this.getCampaignAnalytics(campaign.id);
      if (stats && stats.metrics.sent > 0) {
        rankings.push({
          campaignId: campaign.id,
          title: campaign.title,
          type: campaign.campaignType,
          completedAt: campaign.completedAt,
          ...stats.metrics,
        });
      }
    }

    // Sort by open rate descending
    rankings.sort((a, b) => b.openRate - a.openRate);

    return rankings.slice(0, limit);
  }

  /**
   * Get engagement breakdown by subscriber role.
   */
  async getEngagementByRole() {
    const roles = ['CLIENT', 'REALTOR', 'INVESTOR'];
    const results: Record<string, any> = {};

    for (const role of roles) {
      const subscribers = await this.prisma.emailSubscriber.findMany({
        where: { role: role as any, isSubscribed: true },
        select: { id: true },
      });

      const subscriberIds = subscribers.map(s => s.id);
      if (subscriberIds.length === 0) {
        results[role] = { subscribers: 0, sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 };
        continue;
      }

      const logs = await this.prisma.campaignLog.groupBy({
        by: ['status'],
        where: { subscriberId: { in: subscriberIds } },
        _count: { id: true },
      });

      const statusMap: Record<string, number> = {};
      for (const log of logs) {
        statusMap[log.status] = log._count.id;
      }

      const sent = (statusMap[CampaignLogStatus.SENT] || 0) +
                   (statusMap[CampaignLogStatus.OPENED] || 0) +
                   (statusMap[CampaignLogStatus.CLICKED] || 0);
      const opened = (statusMap[CampaignLogStatus.OPENED] || 0) +
                     (statusMap[CampaignLogStatus.CLICKED] || 0);
      const clicked = statusMap[CampaignLogStatus.CLICKED] || 0;

      results[role] = {
        subscribers: subscriberIds.length,
        sent,
        opened,
        clicked,
        openRate: sent > 0 ? Math.round((opened / sent) * 10000) / 100 : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 10000) / 100 : 0,
      };
    }

    return results;
  }
}
