import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { RankingPeriod } from '@prisma/client';

@Injectable()
export class StaffRankingService {
  private readonly logger = new Logger(StaffRankingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Run daily at 00:05
  @Cron('0 5 0 * * *')
  async updateDailyStaffRankings() {
    this.logger.log('Updating weekly staff rankings...');
    await this.calculateStaffRankings('WEEKLY');
  }

  // Run on 1st of every month at 00:05
  @Cron('0 5 0 1 * *')
  async updateMonthlyStaffRankings() {
    this.logger.log('Updating monthly staff rankings...');
    await this.calculateStaffRankings('MONTHLY');
    await this.determineStaffOfMonth();
  }

  // Run on January 1st at 00:05
  @Cron('0 5 0 1 1 *')
  async updateYearlyStaffRankings() {
    this.logger.log('Updating yearly staff rankings...');
    await this.calculateStaffRankings('YEARLY');
    await this.determineStaffOfYear();
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
    tasksCompleted: number,
    tasksOnTime: number,
    attendanceRate: number,
    avgReviewScore: number,
  ): number {
    const onTimeRate = tasksCompleted > 0 ? (tasksOnTime / tasksCompleted) * 100 : 0;
    return (tasksCompleted * 50) + (onTimeRate * 30) + (attendanceRate * 20) + (avgReviewScore * 100);
  }

  async calculateStaffRankings(period: RankingPeriod) {
    const { periodStart, periodEnd } = this.getDateRange(period);

    // Get all active staff
    const activeStaff = await this.prisma.staffProfile.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const staffData: Array<{
      staffProfileId: string;
      tasksCompleted: number;
      tasksOnTime: number;
      attendanceDays: number;
      attendanceRate: number;
      avgReviewScore: number;
      score: number;
    }> = [];

    for (const staff of activeStaff) {
      // Tasks completed in period
      const completedTasks = await this.prisma.staffTask.findMany({
        where: {
          assigneeId: staff.id,
          status: 'COMPLETED',
          completedAt: { gte: periodStart, lte: periodEnd },
        },
        select: { completedAt: true, dueDate: true },
      });

      const tasksCompleted = completedTasks.length;
      const tasksOnTime = completedTasks.filter(
        (t) => t.dueDate && t.completedAt && t.completedAt <= t.dueDate,
      ).length;

      // Attendance in period
      const attendanceRecords = await this.prisma.attendance.count({
        where: {
          staffProfileId: staff.id,
          date: { gte: periodStart, lte: periodEnd },
          status: { in: ['PRESENT', 'WORK_FROM_HOME', 'LATE'] },
        },
      });

      // Calculate working days (approximate: exclude weekends)
      const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const workingDays = Math.round(totalDays * 5 / 7) || 1;
      const attendanceRate = Math.min((attendanceRecords / workingDays) * 100, 100);

      // Performance reviews in period
      const reviews = await this.prisma.performanceReview.findMany({
        where: {
          revieweeId: staff.id,
          status: 'COMPLETED',
          periodEnd: { gte: periodStart, lte: periodEnd },
        },
        select: { overallRating: true },
      });

      const avgReviewScore = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length
        : 0;

      const score = this.calculateScore(tasksCompleted, tasksOnTime, attendanceRate, avgReviewScore);

      staffData.push({
        staffProfileId: staff.id,
        tasksCompleted,
        tasksOnTime,
        attendanceDays: attendanceRecords,
        attendanceRate,
        avgReviewScore,
        score,
      });
    }

    // Sort by score descending
    staffData.sort((a, b) => b.score - a.score);

    // Upsert rankings
    for (let i = 0; i < staffData.length; i++) {
      const data = staffData[i];
      const rank = i + 1;

      await this.prisma.staffRanking.upsert({
        where: {
          staffProfileId_period_periodStart: {
            staffProfileId: data.staffProfileId,
            period,
            periodStart,
          },
        },
        update: {
          rank,
          tasksCompleted: data.tasksCompleted,
          tasksOnTime: data.tasksOnTime,
          attendanceDays: data.attendanceDays,
          attendanceRate: data.attendanceRate,
          avgReviewScore: data.avgReviewScore,
          score: data.score,
          periodEnd,
        },
        create: {
          staffProfileId: data.staffProfileId,
          period,
          periodStart,
          periodEnd,
          rank,
          tasksCompleted: data.tasksCompleted,
          tasksOnTime: data.tasksOnTime,
          attendanceDays: data.attendanceDays,
          attendanceRate: data.attendanceRate,
          avgReviewScore: data.avgReviewScore,
          score: data.score,
        },
      });

      await this.prisma.staffProfile.update({
        where: { id: data.staffProfileId },
        data: { currentRank: rank },
      });
    }

    this.logger.log(`Updated ${staffData.length} staff rankings for period: ${period}`);
  }

  async determineStaffOfMonth() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const topStaff = await this.prisma.staffRanking.findFirst({
      where: {
        period: 'MONTHLY',
        periodStart: { gte: periodStart },
      },
      orderBy: { rank: 'asc' },
    });

    if (topStaff) {
      await this.prisma.staffProfile.updateMany({
        data: { isStaffOfMonth: false },
      });

      await this.prisma.staffProfile.update({
        where: { id: topStaff.staffProfileId },
        data: {
          isStaffOfMonth: true,
          staffOfMonthCount: { increment: 1 },
        },
      });

      this.logger.log(`Staff of the Month: ${topStaff.staffProfileId}`);
    }
  }

  async determineStaffOfYear() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear() - 1, 0, 1);

    const topStaff = await this.prisma.staffRanking.findFirst({
      where: {
        period: 'YEARLY',
        periodStart: { gte: periodStart },
      },
      orderBy: { rank: 'asc' },
    });

    if (topStaff) {
      await this.prisma.staffProfile.updateMany({
        data: { isStaffOfYear: false },
      });

      await this.prisma.staffProfile.update({
        where: { id: topStaff.staffProfileId },
        data: {
          isStaffOfYear: true,
          staffOfYearCount: { increment: 1 },
        },
      });

      this.logger.log(`Staff of the Year: ${topStaff.staffProfileId}`);
    }
  }

  async getStaffLeaderboard(period: RankingPeriod = 'MONTHLY', limit: number = 10) {
    const { periodStart } = this.getDateRange(period);

    // Try pre-calculated rankings
    const rankings = await this.prisma.staffRanking.findMany({
      where: {
        period,
        periodStart: { gte: periodStart },
      },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        staffProfile: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
            },
            department: { select: { name: true } },
          },
        },
      },
    });

    if (rankings.length > 0) {
      return rankings.map((r) => ({
        rank: r.rank,
        staffProfileId: r.staffProfileId,
        userId: r.staffProfile.user.id,
        name: `${r.staffProfile.user.firstName} ${r.staffProfile.user.lastName}`,
        avatar: r.staffProfile.user.avatar,
        email: r.staffProfile.user.email,
        position: r.staffProfile.position,
        department: r.staffProfile.department?.name || '',
        title: r.staffProfile.title,
        tasksCompleted: r.tasksCompleted,
        tasksOnTime: r.tasksOnTime,
        attendanceRate: r.attendanceRate,
        avgReviewScore: r.avgReviewScore,
        score: r.score,
        isStaffOfMonth: r.staffProfile.isStaffOfMonth,
        isStaffOfYear: r.staffProfile.isStaffOfYear,
      }));
    }

    // Fallback: real-time calculation
    this.logger.log(`No pre-calculated staff rankings for ${period}, calculating...`);

    const allStaff = await this.prisma.staffProfile.findMany({
      where: { isActive: true },
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        department: { select: { name: true } },
        _count: { select: { tasksAssigned: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return allStaff.map((s, index) => ({
      rank: index + 1,
      staffProfileId: s.id,
      userId: s.user.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      avatar: s.user.avatar,
      email: s.user.email,
      position: s.position,
      department: s.department?.name || '',
      title: s.title,
      tasksCompleted: 0,
      tasksOnTime: 0,
      attendanceRate: 0,
      avgReviewScore: 0,
      score: 0,
      isStaffOfMonth: s.isStaffOfMonth,
      isStaffOfYear: s.isStaffOfYear,
    }));
  }

  async getStaffRanking(staffProfileId: string) {
    const rankings = await this.prisma.staffRanking.findMany({
      where: { staffProfileId },
      orderBy: { periodEnd: 'desc' },
      take: 12,
    });

    const currentRank = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
      select: {
        currentRank: true,
        isStaffOfMonth: true,
        isStaffOfYear: true,
        staffOfMonthCount: true,
        staffOfYearCount: true,
      },
    });

    return {
      ...currentRank,
      history: rankings,
    };
  }

  async getStaffOfMonth() {
    return this.prisma.staffProfile.findFirst({
      where: { isStaffOfMonth: true },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true, email: true },
        },
        department: { select: { name: true } },
      },
    });
  }

  async getStaffOfYear() {
    return this.prisma.staffProfile.findFirst({
      where: { isStaffOfYear: true },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatar: true, email: true },
        },
        department: { select: { name: true } },
      },
    });
  }
}
