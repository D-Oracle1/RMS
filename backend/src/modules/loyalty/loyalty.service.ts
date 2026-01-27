import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LoyaltyTier } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  private readonly POINTS_PER_SALE = 100;
  private readonly BONUS_MULTIPLIER = {
    [LoyaltyTier.BRONZE]: 1,
    [LoyaltyTier.SILVER]: 1.25,
    [LoyaltyTier.GOLD]: 1.5,
    [LoyaltyTier.PLATINUM]: 2,
  };

  private readonly TIER_THRESHOLDS = {
    [LoyaltyTier.BRONZE]: 0,
    [LoyaltyTier.SILVER]: 5000,
    [LoyaltyTier.GOLD]: 15000,
    [LoyaltyTier.PLATINUM]: 50000,
  };

  private readonly ACHIEVEMENTS = {
    FIRST_SALE: { id: 'first_sale', name: 'First Sale', points: 500 },
    TEN_SALES: { id: 'ten_sales', name: 'Rising Star', points: 1000 },
    FIFTY_SALES: { id: 'fifty_sales', name: 'Sales Expert', points: 5000 },
    HUNDRED_SALES: { id: 'hundred_sales', name: 'Sales Legend', points: 10000 },
    MILLION_DOLLAR: { id: 'million_dollar', name: 'Million Dollar Agent', points: 5000 },
    REALTOR_OF_MONTH: { id: 'realtor_of_month', name: 'Realtor of the Month', points: 2000 },
    REALTOR_OF_YEAR: { id: 'realtor_of_year', name: 'Realtor of the Year', points: 10000 },
  };

  constructor(private readonly prisma: PrismaService) {}

  async awardPoints(data: {
    realtorId: string;
    saleId: string;
    saleValue: number;
  }) {
    const realtor = await this.prisma.realtorProfile.findUnique({
      where: { id: data.realtorId },
    });

    if (!realtor) {
      throw new Error('Realtor not found');
    }

    // Calculate points based on sale value and tier multiplier
    const basePoints = this.POINTS_PER_SALE + Math.floor(data.saleValue / 10000);
    const multiplier = this.BONUS_MULTIPLIER[realtor.loyaltyTier];
    const points = Math.floor(basePoints * multiplier);

    // Create loyalty points record
    await this.prisma.loyaltyPoints.create({
      data: {
        realtorId: data.realtorId,
        points,
        source: 'SALE',
        saleId: data.saleId,
        description: `Points for sale worth $${data.saleValue.toLocaleString()}`,
      },
    });

    // Update realtor's total points
    const newTotalPoints = realtor.loyaltyPoints + points;

    // Check for tier upgrade
    const newTier = this.calculateTier(newTotalPoints);

    // Check for achievements
    const achievements = await this.checkAchievements(data.realtorId, realtor);

    await this.prisma.realtorProfile.update({
      where: { id: data.realtorId },
      data: {
        loyaltyPoints: newTotalPoints,
        loyaltyTier: newTier,
        achievements: {
          set: achievements,
        },
      },
    });

    return points;
  }

  private calculateTier(points: number): LoyaltyTier {
    if (points >= this.TIER_THRESHOLDS[LoyaltyTier.PLATINUM]) {
      return LoyaltyTier.PLATINUM;
    } else if (points >= this.TIER_THRESHOLDS[LoyaltyTier.GOLD]) {
      return LoyaltyTier.GOLD;
    } else if (points >= this.TIER_THRESHOLDS[LoyaltyTier.SILVER]) {
      return LoyaltyTier.SILVER;
    }
    return LoyaltyTier.BRONZE;
  }

  private async checkAchievements(realtorId: string, realtor: any): Promise<string[]> {
    const achievements = [...realtor.achievements];

    // Get sales count
    const salesCount = await this.prisma.sale.count({
      where: { realtorId, status: 'COMPLETED' },
    });

    // Get total sales value
    const salesValue = await this.prisma.sale.aggregate({
      where: { realtorId, status: 'COMPLETED' },
      _sum: { salePrice: true },
    });

    const totalValue = Number(salesValue._sum.salePrice || 0);

    // Check achievements
    if (salesCount >= 1 && !achievements.includes(this.ACHIEVEMENTS.FIRST_SALE.id)) {
      achievements.push(this.ACHIEVEMENTS.FIRST_SALE.id);
      await this.awardBonusPoints(realtorId, this.ACHIEVEMENTS.FIRST_SALE.points, 'ACHIEVEMENT', 'First Sale achievement');
    }

    if (salesCount >= 10 && !achievements.includes(this.ACHIEVEMENTS.TEN_SALES.id)) {
      achievements.push(this.ACHIEVEMENTS.TEN_SALES.id);
      await this.awardBonusPoints(realtorId, this.ACHIEVEMENTS.TEN_SALES.points, 'ACHIEVEMENT', 'Rising Star achievement');
    }

    if (salesCount >= 50 && !achievements.includes(this.ACHIEVEMENTS.FIFTY_SALES.id)) {
      achievements.push(this.ACHIEVEMENTS.FIFTY_SALES.id);
      await this.awardBonusPoints(realtorId, this.ACHIEVEMENTS.FIFTY_SALES.points, 'ACHIEVEMENT', 'Sales Expert achievement');
    }

    if (salesCount >= 100 && !achievements.includes(this.ACHIEVEMENTS.HUNDRED_SALES.id)) {
      achievements.push(this.ACHIEVEMENTS.HUNDRED_SALES.id);
      await this.awardBonusPoints(realtorId, this.ACHIEVEMENTS.HUNDRED_SALES.points, 'ACHIEVEMENT', 'Sales Legend achievement');
    }

    if (totalValue >= 1000000 && !achievements.includes(this.ACHIEVEMENTS.MILLION_DOLLAR.id)) {
      achievements.push(this.ACHIEVEMENTS.MILLION_DOLLAR.id);
      await this.awardBonusPoints(realtorId, this.ACHIEVEMENTS.MILLION_DOLLAR.points, 'ACHIEVEMENT', 'Million Dollar Agent achievement');
    }

    return achievements;
  }

  private async awardBonusPoints(realtorId: string, points: number, source: string, description: string) {
    await this.prisma.loyaltyPoints.create({
      data: {
        realtorId,
        points,
        source,
        description,
      },
    });
  }

  async getRealtorLoyalty(realtorId: string) {
    const realtor = await this.prisma.realtorProfile.findUnique({
      where: { id: realtorId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!realtor) {
      throw new Error('Realtor not found');
    }

    const pointsHistory = await this.prisma.loyaltyPoints.findMany({
      where: { realtorId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const nextTier = this.getNextTier(realtor.loyaltyTier);
    const pointsToNextTier = nextTier
      ? this.TIER_THRESHOLDS[nextTier] - realtor.loyaltyPoints
      : 0;
    const progressToNextTier = nextTier
      ? (realtor.loyaltyPoints / this.TIER_THRESHOLDS[nextTier]) * 100
      : 100;

    return {
      currentTier: realtor.loyaltyTier,
      totalPoints: realtor.loyaltyPoints,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      progressToNextTier: Math.min(100, progressToNextTier),
      achievements: realtor.achievements,
      pointsHistory,
      tierBenefits: this.getTierBenefits(realtor.loyaltyTier),
    };
  }

  private getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
    const tierOrder = [LoyaltyTier.BRONZE, LoyaltyTier.SILVER, LoyaltyTier.GOLD, LoyaltyTier.PLATINUM];
    const currentIndex = tierOrder.indexOf(currentTier);
    return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
  }

  private getTierBenefits(tier: LoyaltyTier) {
    const benefits = {
      [LoyaltyTier.BRONZE]: {
        commissionRate: '3%',
        pointsMultiplier: '1x',
        perks: ['Basic dashboard access', 'Standard support'],
      },
      [LoyaltyTier.SILVER]: {
        commissionRate: '3.5%',
        pointsMultiplier: '1.25x',
        perks: ['Enhanced dashboard', 'Priority support', 'Monthly reports'],
      },
      [LoyaltyTier.GOLD]: {
        commissionRate: '4%',
        pointsMultiplier: '1.5x',
        perks: ['Premium dashboard', 'Dedicated support', 'Weekly reports', 'Exclusive listings'],
      },
      [LoyaltyTier.PLATINUM]: {
        commissionRate: '5%',
        pointsMultiplier: '2x',
        perks: ['VIP dashboard', 'Personal account manager', 'Daily reports', 'First access to new listings', 'Exclusive events'],
      },
    };
    return benefits[tier];
  }

  async getLeaderboard(limit: number = 10) {
    return this.prisma.realtorProfile.findMany({
      orderBy: { loyaltyPoints: 'desc' },
      take: limit,
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }

  async getTierDistribution() {
    const distribution = await this.prisma.realtorProfile.groupBy({
      by: ['loyaltyTier'],
      _count: { id: true },
    });

    return distribution.reduce((acc, item) => {
      acc[item.loyaltyTier] = item._count.id;
      return acc;
    }, {} as Record<string, number>);
  }
}
