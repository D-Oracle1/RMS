import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { RankingPeriod, SaleStatus } from '@prisma/client';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateDailyRankings() {
    this.logger.log('Updating daily rankings...');
    await this.calculateRankings('WEEKLY');
  }

  // Run on 1st of every month
  @Cron('0 0 1 * *')
  async updateMonthlyRankings() {
    this.logger.log('Updating monthly rankings...');
    await this.calculateRankings('MONTHLY');
    await this.determineRealtorOfMonth();
  }

  // Run on January 1st
  @Cron('0 0 1 1 *')
  async updateYearlyRankings() {
    this.logger.log('Updating yearly rankings...');
    await this.calculateRankings('YEARLY');
    await this.determineRealtorOfYear();
  }

  async calculateRankings(period: RankingPeriod) {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case 'WEEKLY':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        periodEnd = now;
        break;
      case 'MONTHLY':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'QUARTERLY':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'YEARLY':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'ALL_TIME':
        periodStart = new Date(2000, 0, 1);
        periodEnd = now;
        break;
    }

    // Get sales data for the period
    const salesData = await this.prisma.sale.groupBy({
      by: ['realtorId'],
      where: {
        status: SaleStatus.COMPLETED,
        saleDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      _count: { id: true },
      _sum: { salePrice: true, commissionAmount: true },
    });

    // Calculate scores and sort
    const rankedData = salesData
      .map((data) => ({
        realtorId: data.realtorId,
        totalSales: data._count.id,
        totalValue: Number(data._sum.salePrice || 0),
        totalCommission: Number(data._sum.commissionAmount || 0),
        score: this.calculateScore(data._count.id, Number(data._sum.salePrice || 0)),
      }))
      .sort((a, b) => b.score - a.score);

    // Update rankings
    for (let i = 0; i < rankedData.length; i++) {
      const data = rankedData[i];
      const rank = i + 1;

      // Upsert ranking
      await this.prisma.ranking.upsert({
        where: {
          realtorId_period_periodStart: {
            realtorId: data.realtorId,
            period,
            periodStart,
          },
        },
        update: {
          rank,
          totalSales: data.totalSales,
          totalValue: data.totalValue,
          score: data.score,
        },
        create: {
          realtorId: data.realtorId,
          period,
          periodStart,
          periodEnd,
          rank,
          totalSales: data.totalSales,
          totalValue: data.totalValue,
          score: data.score,
        },
      });

      // Update current rank on realtor profile
      await this.prisma.realtorProfile.update({
        where: { id: data.realtorId },
        data: { currentRank: rank },
      });
    }

    this.logger.log(`Updated ${rankedData.length} rankings for period: ${period}`);
  }

  private calculateScore(salesCount: number, totalValue: number): number {
    // Score formula: (salesCount * 100) + (totalValue / 10000)
    return salesCount * 100 + totalValue / 10000;
  }

  async determineRealtorOfMonth() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const topRealtor = await this.prisma.ranking.findFirst({
      where: {
        period: 'MONTHLY',
        periodStart: {
          gte: periodStart,
        },
      },
      orderBy: { rank: 'asc' },
    });

    if (topRealtor) {
      // Reset all realtors' isRealtorOfMonth
      await this.prisma.realtorProfile.updateMany({
        data: { isRealtorOfMonth: false },
      });

      // Set the winner
      await this.prisma.realtorProfile.update({
        where: { id: topRealtor.realtorId },
        data: {
          isRealtorOfMonth: true,
          realtorOfMonthCount: { increment: 1 },
        },
      });

      this.logger.log(`Realtor of the Month: ${topRealtor.realtorId}`);
    }
  }

  async determineRealtorOfYear() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear() - 1, 0, 1);

    const topRealtor = await this.prisma.ranking.findFirst({
      where: {
        period: 'YEARLY',
        periodStart: {
          gte: periodStart,
        },
      },
      orderBy: { rank: 'asc' },
    });

    if (topRealtor) {
      // Reset all realtors' isRealtorOfYear
      await this.prisma.realtorProfile.updateMany({
        data: { isRealtorOfYear: false },
      });

      // Set the winner
      await this.prisma.realtorProfile.update({
        where: { id: topRealtor.realtorId },
        data: {
          isRealtorOfYear: true,
          realtorOfYearCount: { increment: 1 },
        },
      });

      this.logger.log(`Realtor of the Year: ${topRealtor.realtorId}`);
    }
  }

  async getLeaderboard(period: RankingPeriod = 'MONTHLY', limit: number = 10) {
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'WEEKLY':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'MONTHLY':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'YEARLY':
        periodStart = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        periodStart = new Date(2000, 0, 1);
    }

    const rankings = await this.prisma.ranking.findMany({
      where: {
        period,
        periodStart: { gte: periodStart },
      },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        realtor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    return rankings.map((r) => ({
      rank: r.rank,
      realtorId: r.realtorId,
      name: `${r.realtor.user.firstName} ${r.realtor.user.lastName}`,
      avatar: r.realtor.user.avatar,
      tier: r.realtor.loyaltyTier,
      totalSales: r.totalSales,
      totalValue: r.totalValue,
      score: r.score,
      isRealtorOfMonth: r.realtor.isRealtorOfMonth,
      isRealtorOfYear: r.realtor.isRealtorOfYear,
    }));
  }

  async getRealtorRanking(realtorId: string) {
    const rankings = await this.prisma.ranking.findMany({
      where: { realtorId },
      orderBy: { periodEnd: 'desc' },
      take: 12,
    });

    const currentRank = await this.prisma.realtorProfile.findUnique({
      where: { id: realtorId },
      select: {
        currentRank: true,
        isRealtorOfMonth: true,
        isRealtorOfYear: true,
        realtorOfMonthCount: true,
        realtorOfYearCount: true,
      },
    });

    return {
      ...currentRank,
      history: rankings,
    };
  }

  async getRealtorOfMonth() {
    return this.prisma.realtorProfile.findFirst({
      where: { isRealtorOfMonth: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });
  }

  async getRealtorOfYear() {
    return this.prisma.realtorProfile.findFirst({
      where: { isRealtorOfYear: true },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });
  }
}
