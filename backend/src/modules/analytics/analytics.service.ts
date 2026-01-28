import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SaleStatus, PropertyType, PropertyStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
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

    return analytics;
  }

  async getPropertyAnalytics() {
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

    return {
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
  }

  async getRealtorAnalytics() {
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

    return {
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
  }

  async getCommissionAnalytics() {
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

    return {
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
  }

  async getMarketTrends() {
    const [priceHistory, salesVelocity, demandByType, seasonality] = await Promise.all([
      this.getPriceHistory(),
      this.getSalesVelocity(),
      this.getDemandByPropertyType(),
      this.getSeasonalTrends(),
    ]);

    return {
      priceHistory,
      salesVelocity,
      demandByType,
      seasonality,
    };
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
    const months = 12;
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const sum = await this.prisma.commission.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      results.push({
        month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: sum._sum.amount || 0,
      });
    }

    return results;
  }

  private async getCommissionsByTier() {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

    return Promise.all(
      tiers.map(async (tier) => {
        const sum = await this.prisma.commission.aggregate({
          where: {
            realtor: { loyaltyTier: tier as any },
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        return {
          tier,
          amount: sum._sum.amount || 0,
          count: sum._count.id,
        };
      }),
    );
  }

  private async getPriceHistory() {
    // Get average price by month for the last 12 months
    const months = 12;
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const avg = await this.prisma.sale.aggregate({
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: start, lte: end },
        },
        _avg: { salePrice: true },
      });

      results.push({
        month: start.toLocaleDateString('en-US', { month: 'short' }),
        avgPrice: avg._avg.salePrice || 0,
      });
    }

    return results;
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    return Promise.all(
      months.map(async (month, index) => {
        const start = new Date(now.getFullYear(), index, 1);
        const end = new Date(now.getFullYear(), index + 1, 0);

        const count = await this.prisma.sale.count({
          where: {
            status: SaleStatus.COMPLETED,
            saleDate: { gte: start, lte: end },
          },
        });

        return { month, sales: count };
      }),
    );
  }
}
