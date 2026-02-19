import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { SaleStatus, PropertyType, PropertyStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getSalesAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const cacheKey = `analytics:sales:${period}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const periods = this.getPeriodDates(period);

    const analytics = await Promise.all(
      periods.map(async ({ start, end, label }) => {
        const [count, sum] = await Promise.all([
          this.prisma.sale.count({
            where: {
              status: SaleStatus.COMPLETED,
              saleDate: { gte: start, lte: end },
            },
          }),
          this.prisma.sale.aggregate({
            where: {
              status: SaleStatus.COMPLETED,
              saleDate: { gte: start, lte: end },
            },
            _sum: { salePrice: true, commissionAmount: true },
          }),
        ]);

        return {
          period: label,
          sales: count,
          revenue: sum._sum.salePrice || 0,
          commission: sum._sum.commissionAmount || 0,
          growth: 0,
        };
      }),
    );

    // Calculate growth
    for (let i = 1; i < analytics.length; i++) {
      const prev = Number(analytics[i - 1].revenue);
      const curr = Number(analytics[i].revenue);
      (analytics[i] as any).growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    }

    await this.cacheService.set(cacheKey, analytics, 120);
    return analytics;
  }

  async getPropertyAnalytics() {
    const cacheKey = 'analytics:property';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const [
      byType,
      byStatus,
      priceRanges,
      avgPrices,
      locationStats,
    ] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['type'],
        _count: { id: true },
        _avg: { price: true },
      }),
      this.prisma.property.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.getPriceRangeDistribution(),
      this.prisma.property.aggregate({
        _avg: { price: true, area: true },
        _min: { price: true },
        _max: { price: true },
      }),
      this.getLocationStats(),
    ]);

    const result = {
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count.id,
        avgPrice: t._avg.price,
      })),
      byStatus: byStatus.reduce((acc, s) => {
        acc[s.status] = s._count.id;
        return acc;
      }, {} as Record<string, number>),
      priceRanges,
      averages: {
        price: avgPrices._avg.price,
        area: avgPrices._avg.area,
        minPrice: avgPrices._min.price,
        maxPrice: avgPrices._max.price,
      },
      locationStats,
    };

    await this.cacheService.set(cacheKey, result, 120);
    return result;
  }

  async getRealtorAnalytics() {
    const cacheKey = 'analytics:realtor';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const [
      performanceDistribution,
      tierDistribution,
      topPerformers,
      avgMetrics,
    ] = await Promise.all([
      this.getPerformanceDistribution(),
      this.prisma.realtorProfile.groupBy({
        by: ['loyaltyTier'],
        _count: { id: true },
        _avg: { totalSales: true, loyaltyPoints: true },
      }),
      this.prisma.realtorProfile.findMany({
        orderBy: { totalSalesValue: 'desc' },
        take: 10,
        include: {
          user: {
            select: { firstName: true, lastName: true, avatar: true },
          },
        },
      }),
      this.prisma.realtorProfile.aggregate({
        _avg: {
          totalSales: true,
          totalSalesValue: true,
          totalCommission: true,
          loyaltyPoints: true,
        },
      }),
    ]);

    const result = {
      tierDistribution: tierDistribution.map((t) => ({
        tier: t.loyaltyTier,
        count: t._count.id,
        avgSales: t._avg.totalSales,
        avgPoints: t._avg.loyaltyPoints,
      })),
      performanceDistribution,
      topPerformers: topPerformers.map((r) => ({
        id: r.id,
        name: `${r.user.firstName} ${r.user.lastName}`,
        avatar: r.user.avatar,
        tier: r.loyaltyTier,
        totalSales: r.totalSales,
        totalValue: r.totalSalesValue,
        totalCommission: r.totalCommission,
      })),
      averages: {
        sales: avgMetrics._avg.totalSales,
        value: avgMetrics._avg.totalSalesValue,
        commission: avgMetrics._avg.totalCommission,
        points: avgMetrics._avg.loyaltyPoints,
      },
    };

    await this.cacheService.set(cacheKey, result, 120);
    return result;
  }

  async getCommissionAnalytics() {
    const cacheKey = 'analytics:commission';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [monthlyCommissions, byTier, pending, paid] = await Promise.all([
      this.getMonthlyCommissions(),
      this.getCommissionsByTier(),
      this.prisma.commission.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const result = {
      monthly: monthlyCommissions,
      byTier,
      pending: {
        amount: pending._sum.amount || 0,
        count: pending._count.id,
      },
      paid: {
        amount: paid._sum.amount || 0,
        count: paid._count.id,
      },
    };

    await this.cacheService.set(cacheKey, result, 120);
    return result;
  }

  async getMarketTrends() {
    const cacheKey = 'analytics:marketTrends';
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const [priceHistory, salesVelocity, demandByType, seasonality] = await Promise.all([
      this.getPriceHistory(),
      this.getSalesVelocity(),
      this.getDemandByPropertyType(),
      this.getSeasonalTrends(),
    ]);

    const result = {
      priceHistory,
      salesVelocity,
      demandByType,
      seasonality,
    };

    await this.cacheService.set(cacheKey, result, 120);
    return result;
  }

  // Helper methods
  private getPeriodDates(period: string) {
    const now = new Date();
    const periods = [];

    switch (period) {
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          periods.push({
            start: new Date(date.setHours(0, 0, 0, 0)),
            end: new Date(date.setHours(23, 59, 59, 999)),
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          });
        }
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          periods.push({
            start: new Date(date.setHours(0, 0, 0, 0)),
            end: new Date(date.setHours(23, 59, 59, 999)),
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          });
        }
        break;
      case 'quarter':
        for (let i = 2; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          periods.push({
            start,
            end,
            label: start.toLocaleDateString('en-US', { month: 'short' }),
          });
        }
        break;
      case 'year':
        for (let i = 11; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          periods.push({
            start,
            end,
            label: start.toLocaleDateString('en-US', { month: 'short' }),
          });
        }
        break;
    }

    return periods;
  }

  private async getPriceRangeDistribution() {
    const ranges = [
      { min: 0, max: 100000, label: '<$100K' },
      { min: 100000, max: 250000, label: '$100K-$250K' },
      { min: 250000, max: 500000, label: '$250K-$500K' },
      { min: 500000, max: 1000000, label: '$500K-$1M' },
      { min: 1000000, max: 999999999, label: '>$1M' },
    ];

    return Promise.all(
      ranges.map(async (range) => {
        const count = await this.prisma.property.count({
          where: {
            price: { gte: range.min, lt: range.max },
          },
        });
        return { label: range.label, count };
      }),
    );
  }

  private async getLocationStats() {
    return this.prisma.property.groupBy({
      by: ['city'],
      _count: { id: true },
      _avg: { price: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
  }

  private async getPerformanceDistribution() {
    const ranges = [
      { min: 0, max: 5, label: '0-5 sales' },
      { min: 5, max: 15, label: '5-15 sales' },
      { min: 15, max: 30, label: '15-30 sales' },
      { min: 30, max: 50, label: '30-50 sales' },
      { min: 50, max: 9999, label: '50+ sales' },
    ];

    return Promise.all(
      ranges.map(async (range) => {
        const count = await this.prisma.realtorProfile.count({
          where: {
            totalSales: { gte: range.min, lt: range.max },
          },
        });
        return { label: range.label, count };
      }),
    );
  }

  private async getMonthlyCommissions() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Single query instead of 12
    const commissions = await this.prisma.commission.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, amount: true },
    });

    // Bucket into months in JS
    const buckets = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, 0);
    }
    for (const c of commissions) {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + Number(c.amount || 0));
      }
    }

    return Array.from(buckets.entries()).map(([key, amount]) => {
      const [yr, mo] = key.split('-').map(Number);
      return {
        month: new Date(yr, mo, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount,
      };
    });
  }

  private async getCommissionsByTier() {
    // Single query: fetch all commissions with realtor tier
    const commissions = await this.prisma.commission.findMany({
      select: { amount: true, realtor: { select: { loyaltyTier: true } } },
    });

    const tierMap: Record<string, { amount: number; count: number }> = {};
    for (const tier of ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']) {
      tierMap[tier] = { amount: 0, count: 0 };
    }
    for (const c of commissions) {
      const tier = c.realtor?.loyaltyTier || 'BRONZE';
      if (tierMap[tier]) {
        tierMap[tier].amount += Number(c.amount || 0);
        tierMap[tier].count += 1;
      }
    }

    return Object.entries(tierMap).map(([tier, data]) => ({
      tier,
      amount: data.amount,
      count: data.count,
    }));
  }

  private async getPriceHistory() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Single query instead of 12
    const sales = await this.prisma.sale.findMany({
      where: { status: SaleStatus.COMPLETED, saleDate: { gte: startDate } },
      select: { saleDate: true, salePrice: true },
    });

    // Bucket into months
    const buckets = new Map<string, { total: number; count: number }>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { total: 0, count: 0 });
    }
    for (const s of sales) {
      const d = new Date(s.saleDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = buckets.get(key);
      if (b) { b.total += Number(s.salePrice || 0); b.count += 1; }
    }

    return Array.from(buckets.entries()).map(([key, { total, count }]) => {
      const [yr, mo] = key.split('-').map(Number);
      return {
        month: new Date(yr, mo, 1).toLocaleDateString('en-US', { month: 'short' }),
        avgPrice: count > 0 ? total / count : 0,
      };
    });
  }

  private async getSalesVelocity() {
    // Average days on market (simulated)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentSales = await this.prisma.sale.count({
      where: {
        status: SaleStatus.COMPLETED,
        saleDate: { gte: thirtyDaysAgo },
      },
    });

    const activeListings = await this.prisma.property.count({
      where: { isListed: true },
    });

    return {
      salesLast30Days: recentSales,
      activeListings,
      absorptionRate: activeListings > 0 ? (recentSales / activeListings) * 100 : 0,
    };
  }

  private async getDemandByPropertyType() {
    return this.prisma.sale.groupBy({
      by: ['propertyId'],
      _count: { id: true },
    });
  }

  private async getSeasonalTrends() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    // Single query for the entire year
    const sales = await this.prisma.sale.findMany({
      where: { status: SaleStatus.COMPLETED, saleDate: { gte: yearStart, lte: yearEnd } },
      select: { saleDate: true },
    });

    const monthlyCounts = new Array(12).fill(0);
    for (const s of sales) {
      monthlyCounts[new Date(s.saleDate).getMonth()]++;
    }

    return monthNames.map((month, i) => ({ month, sales: monthlyCounts[i] }));
  }
}
