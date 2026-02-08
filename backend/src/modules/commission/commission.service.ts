import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CommissionStatus, LoyaltyTier } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class CommissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  // Fallback commission rates by tier
  private readonly COMMISSION_RATES = {
    [LoyaltyTier.BRONZE]: 0.03,
    [LoyaltyTier.SILVER]: 0.035,
    [LoyaltyTier.GOLD]: 0.04,
    [LoyaltyTier.PLATINUM]: 0.05,
  };

  async create(data: {
    saleId: string;
    realtorId: string;
    amount: number;
    rate: number;
  }) {
    return this.prisma.commission.create({
      data: {
        ...data,
        status: CommissionStatus.PENDING,
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    realtorId?: string;
    status?: CommissionStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, realtorId, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (realtorId) where.realtorId = realtorId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sale: {
            include: {
              property: {
                select: { title: true, address: true },
              },
            },
          },
          realtor: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return {
      data: commissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            property: true,
            client: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
        realtor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    return commission;
  }

  async markAsPaid(id: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
    });

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    return this.prisma.commission.update({
      where: { id },
      data: {
        status: CommissionStatus.PAID,
        paidAt: new Date(),
      },
    });
  }

  async getRealtorCommissions(realtorId: string, query: {
    page?: number;
    limit?: number;
    status?: CommissionStatus;
  }) {
    return this.findAll({ ...query, realtorId });
  }

  async getStats(realtorId?: string) {
    const where = realtorId ? { realtorId } : {};

    const [total, paid, pending, byMonth] = await Promise.all([
      this.prisma.commission.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { ...where, status: CommissionStatus.PAID },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { ...where, status: CommissionStatus.PENDING },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.getMonthlyCommissions(realtorId),
    ]);

    return {
      total: {
        amount: total._sum.amount || 0,
        count: total._count.id,
      },
      paid: {
        amount: paid._sum.amount || 0,
        count: paid._count.id,
      },
      pending: {
        amount: pending._sum.amount || 0,
        count: pending._count.id,
      },
      byMonth,
    };
  }

  private async getMonthlyCommissions(realtorId?: string) {
    const months = 12;
    const now = new Date();
    const results = [];

    for (let i = 0; i < months; i++) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (realtorId) {
        where.realtorId = realtorId;
      }

      const aggregate = await this.prisma.commission.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      });

      results.push({
        month: startDate.toISOString().slice(0, 7),
        amount: aggregate._sum.amount || 0,
        count: aggregate._count.id,
      });
    }

    return results.reverse();
  }

  getCommissionRate(tier: LoyaltyTier): number {
    return this.COMMISSION_RATES[tier] || 0.03;
  }

  async getCommissionRateFromSettings(tier: LoyaltyTier): Promise<number> {
    try {
      const rates = await this.settingsService.getCommissionRates();
      return rates[tier] ?? this.COMMISSION_RATES[tier] ?? 0.03;
    } catch {
      return this.COMMISSION_RATES[tier] || 0.03;
    }
  }

  async calculateCommission(saleValue: number, tier: LoyaltyTier) {
    const rate = await this.getCommissionRateFromSettings(tier);
    const amount = saleValue * rate;
    const taxRate = await this.settingsService.getMainTaxRate();
    const taxAmount = amount * taxRate;
    const netAmount = amount - taxAmount;

    return {
      rate,
      amount,
      taxRate,
      taxAmount,
      netAmount,
    };
  }
}
