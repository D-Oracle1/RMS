import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SaleStatus, PropertyStatus, LoyaltyTier } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalRealtors,
      activeRealtors,
      totalClients,
      totalProperties,
      activeListings,
      totalSales,
      monthlySales,
      yearlySales,
      totalRevenue,
      monthlyRevenue,
      totalCommission,
      monthlyCommission,
      pendingSales,
    ] = await Promise.all([
      this.prisma.realtorProfile.count(),
      this.prisma.realtorProfile.count({
        where: { user: { status: 'ACTIVE' } },
      }),
      this.prisma.clientProfile.count(),
      this.prisma.property.count(),
      this.prisma.property.count({ where: { isListed: true } }),
      this.prisma.sale.count({ where: { status: SaleStatus.COMPLETED } }),
      this.prisma.sale.count({
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: startOfMonth },
        },
      }),
      this.prisma.sale.count({
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: startOfYear },
        },
      }),
      this.prisma.sale.aggregate({
        where: { status: SaleStatus.COMPLETED },
        _sum: { salePrice: true },
      }),
      this.prisma.sale.aggregate({
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: startOfMonth },
        },
        _sum: { salePrice: true },
      }),
      this.prisma.commission.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.commission.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.sale.count({ where: { status: SaleStatus.PENDING } }),
    ]);

    return {
      realtors: {
        total: totalRealtors,
        active: activeRealtors,
      },
      clients: {
        total: totalClients,
      },
      properties: {
        total: totalProperties,
        activeListings,
      },
      sales: {
        total: totalSales,
        monthly: monthlySales,
        yearly: yearlySales,
        pending: pendingSales,
      },
      revenue: {
        total: totalRevenue._sum.salePrice || 0,
        monthly: monthlyRevenue._sum.salePrice || 0,
      },
      commission: {
        total: totalCommission._sum.amount || 0,
        monthly: monthlyCommission._sum.amount || 0,
      },
    };
  }

  async getRealtorMonitoring(query: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: LoyaltyTier;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 20, search, tier, sortBy = 'totalSales', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (tier) {
      where.loyaltyTier = tier;
    }

    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.user = { firstName: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    const [realtors, total] = await Promise.all([
      this.prisma.realtorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              status: true,
              lastLoginAt: true,
            },
          },
          _count: {
            select: {
              sales: true,
              clients: true,
            },
          },
        },
      }),
      this.prisma.realtorProfile.count({ where }),
    ]);

    return {
      data: realtors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRealtorDrilldown(realtorId: string) {
    const realtor = await this.prisma.realtorProfile.findUnique({
      where: { id: realtorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 10,
          include: {
            property: true,
            client: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        clients: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        rankings: {
          orderBy: { periodEnd: 'desc' },
          take: 12,
        },
      },
    });

    if (!realtor) {
      throw new Error('Realtor not found');
    }

    // Get monthly performance
    const monthlyPerformance = await this.getRealtorMonthlyPerformance(realtorId);

    return {
      ...realtor,
      monthlyPerformance,
    };
  }

  async getRealtorMonthlyPerformance(realtorId: string) {
    const months = 12;
    const now = new Date();
    const performance = [];

    for (let i = 0; i < months; i++) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [sales, revenue] = await Promise.all([
        this.prisma.sale.count({
          where: {
            realtorId,
            status: SaleStatus.COMPLETED,
            saleDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        }),
        this.prisma.sale.aggregate({
          where: {
            realtorId,
            status: SaleStatus.COMPLETED,
            saleDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: { salePrice: true },
        }),
      ]);

      performance.push({
        month: startDate.toISOString().slice(0, 7),
        sales,
        revenue: revenue._sum.salePrice || 0,
      });
    }

    return performance.reverse();
  }

  async getRecentSalesFeed(limit: number = 20) {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        property: {
          select: {
            title: true,
            address: true,
            city: true,
          },
        },
        realtor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        client: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async getPerformanceAnalytics(period: 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [salesByRealtor, topProperties, tierDistribution] = await Promise.all([
      this.prisma.sale.groupBy({
        by: ['realtorId'],
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: startDate },
        },
        _count: { id: true },
        _sum: { salePrice: true, commissionAmount: true },
        orderBy: { _sum: { salePrice: 'desc' } },
        take: 10,
      }),
      this.prisma.sale.findMany({
        where: {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: startDate },
        },
        orderBy: { salePrice: 'desc' },
        take: 10,
        include: {
          property: true,
          realtor: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      this.prisma.realtorProfile.groupBy({
        by: ['loyaltyTier'],
        _count: { id: true },
      }),
    ]);

    // Get realtor details for top performers
    const topRealtorIds = salesByRealtor.map((s) => s.realtorId);
    const topRealtors = await this.prisma.realtorProfile.findMany({
      where: { id: { in: topRealtorIds } },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
    });

    const topPerformers = salesByRealtor.map((s) => {
      const realtor = topRealtors.find((r) => r.id === s.realtorId);
      return {
        realtorId: s.realtorId,
        realtor: realtor?.user,
        salesCount: s._count.id,
        totalRevenue: s._sum.salePrice,
        totalCommission: s._sum.commissionAmount,
      };
    });

    return {
      topPerformers,
      topProperties,
      tierDistribution: tierDistribution.reduce((acc, item) => {
        acc[item.loyaltyTier] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
