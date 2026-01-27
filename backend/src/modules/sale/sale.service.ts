import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleStatus, PropertyStatus, LoyaltyTier, CommissionStatus } from '@prisma/client';
import { CommissionService } from '../commission/commission.service';
import { TaxService } from '../tax/tax.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationService } from '../notification/notification.service';
import { ClientService } from '../client/client.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SaleService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CommissionService))
    private readonly commissionService: CommissionService,
    @Inject(forwardRef(() => TaxService))
    private readonly taxService: TaxService,
    @Inject(forwardRef(() => LoyaltyService))
    private readonly loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => ClientService))
    private readonly clientService: ClientService,
  ) {}

  async create(createSaleDto: CreateSaleDto, realtorUserId: string) {
    // Get realtor profile
    const realtorProfile = await this.prisma.realtorProfile.findUnique({
      where: { userId: realtorUserId },
      include: { user: true },
    });

    if (!realtorProfile) {
      throw new BadRequestException('Realtor profile not found');
    }

    // Get or create client
    let clientProfile = await this.prisma.clientProfile.findFirst({
      where: {
        user: { email: createSaleDto.clientEmail },
      },
    });

    if (!clientProfile) {
      const result = await this.clientService.createClient({
        email: createSaleDto.clientEmail,
        firstName: createSaleDto.clientName.split(' ')[0],
        lastName: createSaleDto.clientName.split(' ').slice(1).join(' ') || '',
        phone: createSaleDto.clientContact,
        realtorId: realtorProfile.id,
      });
      clientProfile = result as any;
    }

    // Get commission rate based on loyalty tier
    const commissionRate = this.getCommissionRate(realtorProfile.loyaltyTier);
    const commissionAmount = Number(createSaleDto.saleValue) * commissionRate;

    // Get tax rate
    const taxRate = 0.15; // 15% tax
    const taxAmount = commissionAmount * taxRate;
    const netAmount = commissionAmount - taxAmount;

    // Create the sale
    const sale = await this.prisma.sale.create({
      data: {
        propertyId: createSaleDto.propertyId,
        realtorId: realtorProfile.id,
        clientId: clientProfile.id,
        salePrice: createSaleDto.saleValue,
        saleDate: new Date(createSaleDto.saleDate),
        status: SaleStatus.COMPLETED,
        commissionRate,
        commissionAmount,
        taxRate,
        taxAmount,
        netAmount,
        notes: createSaleDto.notes,
      },
      include: {
        property: true,
        realtor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        client: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    // Update property status
    await this.prisma.property.update({
      where: { id: createSaleDto.propertyId },
      data: {
        status: PropertyStatus.SOLD,
        ownerId: clientProfile.id,
        isListed: false,
      },
    });

    // Create commission record
    await this.commissionService.create({
      saleId: sale.id,
      realtorId: realtorProfile.id,
      amount: commissionAmount,
      rate: commissionRate,
    });

    // Create tax record
    const now = new Date();
    await this.taxService.create({
      saleId: sale.id,
      realtorId: realtorProfile.id,
      amount: taxAmount,
      rate: taxRate,
      year: now.getFullYear(),
      quarter: Math.floor(now.getMonth() / 3) + 1,
    });

    // Award loyalty points
    const points = await this.loyaltyService.awardPoints({
      realtorId: realtorProfile.id,
      saleId: sale.id,
      saleValue: Number(createSaleDto.saleValue),
    });

    // Update sale with loyalty points
    await this.prisma.sale.update({
      where: { id: sale.id },
      data: { loyaltyPointsAwarded: points },
    });

    // Update realtor stats
    await this.updateRealtorStats(realtorProfile.id);

    // Update client stats
    await this.updateClientStats(clientProfile.id, Number(createSaleDto.saleValue));

    // Send notifications
    await this.sendSaleNotifications(sale, realtorProfile);

    return sale;
  }

  private getCommissionRate(tier: LoyaltyTier): number {
    const rates = {
      [LoyaltyTier.BRONZE]: 0.03,
      [LoyaltyTier.SILVER]: 0.035,
      [LoyaltyTier.GOLD]: 0.04,
      [LoyaltyTier.PLATINUM]: 0.05,
    };
    return rates[tier] || 0.03;
  }

  private async updateRealtorStats(realtorId: string) {
    const stats = await this.prisma.sale.aggregate({
      where: {
        realtorId,
        status: SaleStatus.COMPLETED,
      },
      _count: { id: true },
      _sum: {
        salePrice: true,
        commissionAmount: true,
        taxAmount: true,
      },
    });

    await this.prisma.realtorProfile.update({
      where: { id: realtorId },
      data: {
        totalSales: stats._count.id,
        totalSalesValue: stats._sum.salePrice || 0,
        totalCommission: stats._sum.commissionAmount || 0,
        totalTaxPaid: stats._sum.taxAmount || 0,
      },
    });
  }

  private async updateClientStats(clientId: string, purchaseValue: number) {
    const client = await this.prisma.clientProfile.findUnique({
      where: { id: clientId },
    });

    if (client) {
      const properties = await this.prisma.property.findMany({
        where: { ownerId: clientId },
      });

      const totalPropertyValue = properties.reduce(
        (sum, p) => sum + Number(p.price),
        0,
      );

      await this.prisma.clientProfile.update({
        where: { id: clientId },
        data: {
          totalPurchaseValue: {
            increment: purchaseValue,
          },
          totalPropertyValue,
        },
      });
    }
  }

  private async sendSaleNotifications(sale: any, realtor: any) {
    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        userId: admin.id,
        type: 'SALE',
        title: 'New Sale Recorded',
        message: `${realtor.user.firstName} ${realtor.user.lastName} sold ${sale.property.title} for $${Number(sale.salePrice).toLocaleString()}`,
        priority: 'HIGH',
        data: {
          saleId: sale.id,
          propertyId: sale.propertyId,
          realtorId: sale.realtorId,
        },
        link: `/admin/sales/${sale.id}`,
      });
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    realtorId?: string;
    clientId?: string;
    status?: SaleStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, realtorId, clientId, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (realtorId) where.realtorId = realtorId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate);
      if (endDate) where.saleDate.lte = new Date(endDate);
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { saleDate: 'desc' },
        include: {
          property: {
            select: { title: true, address: true, city: true },
          },
          realtor: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
          client: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        property: true,
        realtor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
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
                email: true,
                phone: true,
              },
            },
          },
        },
        commission: true,
        tax: true,
        loyaltyPoints: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async getStats(period?: 'week' | 'month' | 'quarter' | 'year') {
    const now = new Date();
    let startDate: Date | undefined;

    if (period) {
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
    }

    const where = startDate
      ? {
          status: SaleStatus.COMPLETED,
          saleDate: { gte: startDate },
        }
      : { status: SaleStatus.COMPLETED };

    const [count, sum, pending] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({
        where,
        _sum: {
          salePrice: true,
          commissionAmount: true,
          taxAmount: true,
          netAmount: true,
        },
      }),
      this.prisma.sale.count({ where: { status: SaleStatus.PENDING } }),
    ]);

    return {
      totalSales: count,
      pendingSales: pending,
      totalRevenue: sum._sum.salePrice || 0,
      totalCommission: sum._sum.commissionAmount || 0,
      totalTax: sum._sum.taxAmount || 0,
      totalNetEarnings: sum._sum.netAmount || 0,
    };
  }
}
