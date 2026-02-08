import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { RankingPeriod, SaleStatus } from '@prisma/client';

@Injectable()
export class ClientRankingService {
  private readonly logger = new Logger(ClientRankingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run daily at 00:10
  @Cron('0 10 0 * * *')
  async updateDailyClientRankings() {
    this.logger.log('Updating weekly client rankings...');
    await this.calculateClientRankings('WEEKLY');
  }

  // Run on 1st of every month at 00:10
  @Cron('0 10 0 1 * *')
  async updateMonthlyClientRankings() {
    this.logger.log('Updating monthly client rankings...');
    await this.calculateClientRankings('MONTHLY');
    await this.determineClientOfMonth();
  }

  // Run on January 1st at 00:10
  @Cron('0 10 0 1 1 *')
  async updateYearlyClientRankings() {
    this.logger.log('Updating yearly client rankings...');
    await this.calculateClientRankings('YEARLY');
    await this.determineClientOfYear();
  }

  private getDateRange(period: RankingPeriod): { periodStart: Date; periodEnd: Date } {
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

    return { periodStart, periodEnd };
  }

  private calculateScore(
    purchaseCount: number,
    totalPurchaseValue: number,
    propertiesOwned: number,
    totalPropertyValue: number,
  ): number {
    return (purchaseCount * 100) + (totalPurchaseValue / 10000) + (propertiesOwned * 50) + (totalPropertyValue / 50000);
  }

  async calculateClientRankings(period: RankingPeriod) {
    const { periodStart, periodEnd } = this.getDateRange(period);

    // Get purchase data for the period
    const purchaseData = await this.prisma.sale.groupBy({
      by: ['clientId'],
      where: {
        status: SaleStatus.COMPLETED,
        saleDate: { gte: periodStart, lte: periodEnd },
      },
      _count: { id: true },
      _sum: { salePrice: true },
    });

    // Get all clients with property data
    const allClients = await this.prisma.clientProfile.findMany({
      select: {
        id: true,
        totalPropertyValue: true,
        _count: { select: { ownedProperties: true } },
      },
    });

    const clientMap = new Map(allClients.map((c) => [c.id, c]));

    // Build ranked data - include clients with purchases OR properties
    const clientIds = new Set<string>();
    purchaseData.forEach((p) => clientIds.add(p.clientId));
    allClients.forEach((c) => {
      if (c._count.ownedProperties > 0) clientIds.add(c.id);
    });

    const rankedData = Array.from(clientIds).map((clientId) => {
      const purchases = purchaseData.find((p) => p.clientId === clientId);
      const client = clientMap.get(clientId);

      const purchaseCount = purchases?._count.id || 0;
      const totalPurchaseValue = Number(purchases?._sum.salePrice || 0);
      const propertiesOwned = client?._count.ownedProperties || 0;
      const totalPropertyValue = Number(client?.totalPropertyValue || 0);

      return {
        clientProfileId: clientId,
        purchaseCount,
        totalPurchaseValue,
        propertiesOwned,
        totalPropertyValue,
        score: this.calculateScore(purchaseCount, totalPurchaseValue, propertiesOwned, totalPropertyValue),
      };
    }).sort((a, b) => b.score - a.score);

    // Upsert rankings
    for (let i = 0; i < rankedData.length; i++) {
      const data = rankedData[i];
      const rank = i + 1;

      await this.prisma.clientRanking.upsert({
        where: {
          clientProfileId_period_periodStart: {
            clientProfileId: data.clientProfileId,
            period,
            periodStart,
          },
        },
        update: {
          rank,
          purchaseCount: data.purchaseCount,
          totalPurchaseValue: data.totalPurchaseValue,
          totalPropertyValue: data.totalPropertyValue,
          propertiesOwned: data.propertiesOwned,
          score: data.score,
          periodEnd,
        },
        create: {
          clientProfileId: data.clientProfileId,
          period,
          periodStart,
          periodEnd,
          rank,
          purchaseCount: data.purchaseCount,
          totalPurchaseValue: data.totalPurchaseValue,
          totalPropertyValue: data.totalPropertyValue,
          propertiesOwned: data.propertiesOwned,
          score: data.score,
        },
      });

      await this.prisma.clientProfile.update({
        where: { id: data.clientProfileId },
        data: { currentRank: rank },
      });
    }

    this.logger.log(`Updated ${rankedData.length} client rankings for period: ${period}`);
  }

  async determineClientOfMonth() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const topClient = await this.prisma.clientRanking.findFirst({
      where: {
        period: 'MONTHLY',
        periodStart: { gte: periodStart },
      },
      orderBy: { rank: 'asc' },
    });

    if (topClient) {
      await this.prisma.clientProfile.updateMany({
        data: { isClientOfMonth: false },
      });

      await this.prisma.clientProfile.update({
        where: { id: topClient.clientProfileId },
        data: {
          isClientOfMonth: true,
          clientOfMonthCount: { increment: 1 },
        },
      });

      this.logger.log(`Client of the Month: ${topClient.clientProfileId}`);
    }
  }

  async determineClientOfYear() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear() - 1, 0, 1);

    const topClient = await this.prisma.clientRanking.findFirst({
      where: {
        period: 'YEARLY',
        periodStart: { gte: periodStart },
      },
      orderBy: { rank: 'asc' },
    });

    if (topClient) {
      await this.prisma.clientProfile.updateMany({
        data: { isClientOfYear: false },
      });

      await this.prisma.clientProfile.update({
        where: { id: topClient.clientProfileId },
        data: {
          isClientOfYear: true,
          clientOfYearCount: { increment: 1 },
        },
      });

      this.logger.log(`Client of the Year: ${topClient.clientProfileId}`);
    }
  }

  async getClientLeaderboard(period: RankingPeriod = 'MONTHLY', limit: number = 10) {
    const { periodStart } = this.getDateRange(period);

    // Try pre-calculated rankings
    const rankings = await this.prisma.clientRanking.findMany({
      where: {
        period,
        periodStart: { gte: periodStart },
      },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        clientProfile: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
            },
          },
        },
      },
    });

    if (rankings.length > 0) {
      return rankings.map((r) => ({
        rank: r.rank,
        clientProfileId: r.clientProfileId,
        userId: r.clientProfile.user.id,
        name: `${r.clientProfile.user.firstName} ${r.clientProfile.user.lastName}`,
        avatar: r.clientProfile.user.avatar,
        email: r.clientProfile.user.email,
        propertiesOwned: r.propertiesOwned,
        purchaseCount: r.purchaseCount,
        totalPurchaseValue: Number(r.totalPurchaseValue),
        totalPropertyValue: Number(r.totalPropertyValue),
        score: r.score,
        isClientOfMonth: r.clientProfile.isClientOfMonth,
        isClientOfYear: r.clientProfile.isClientOfYear,
      }));
    }

    // Fallback: return clients sorted by properties/purchases
    this.logger.log(`No pre-calculated client rankings for ${period}, calculating...`);

    const allClients = await this.prisma.clientProfile.findMany({
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        _count: { select: { ownedProperties: true, purchases: true } },
      },
      orderBy: { totalPurchaseValue: 'desc' },
    });

    return allClients.map((c, index) => ({
      rank: index + 1,
      clientProfileId: c.id,
      userId: c.user.id,
      name: `${c.user.firstName} ${c.user.lastName}`,
      avatar: c.user.avatar,
      email: c.user.email,
      propertiesOwned: c._count.ownedProperties,
      purchaseCount: c._count.purchases,
      totalPurchaseValue: Number(c.totalPurchaseValue || 0),
      totalPropertyValue: Number(c.totalPropertyValue || 0),
      score: this.calculateScore(
        c._count.purchases,
        Number(c.totalPurchaseValue || 0),
        c._count.ownedProperties,
        Number(c.totalPropertyValue || 0),
      ),
      isClientOfMonth: c.isClientOfMonth,
      isClientOfYear: c.isClientOfYear,
    }));
  }

  async getClientRanking(clientProfileId: string) {
    const rankings = await this.prisma.clientRanking.findMany({
      where: { clientProfileId },
      orderBy: { periodEnd: 'desc' },
      take: 12,
    });

    const currentRank = await this.prisma.clientProfile.findUnique({
      where: { id: clientProfileId },
      select: {
        currentRank: true,
        isClientOfMonth: true,
        isClientOfYear: true,
        clientOfMonthCount: true,
        clientOfYearCount: true,
      },
    });

    return {
      ...currentRank,
      history: rankings,
    };
  }

  async getClientOfMonth() {
    return this.prisma.clientProfile.findFirst({
      where: { isClientOfMonth: true },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true, email: true },
        },
      },
    });
  }

  async getClientOfYear() {
    return this.prisma.clientProfile.findFirst({
      where: { isClientOfYear: true },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true, email: true },
        },
      },
    });
  }
}
