import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { NotificationService } from '../notification/notification.service';
import { AwardType } from '@prisma/client';

const AWARD_LABELS: Record<AwardType, string> = {
  STAFF_OF_MONTH: 'Staff of the Month',
  REALTOR_OF_MONTH: 'Realtor of the Month',
  CLIENT_OF_MONTH: 'Client of the Month',
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable()
export class AwardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateAwardDto) {
    // Check if an award for this type/month/year already exists
    const existing = await this.prisma.monthlyAward.findUnique({
      where: {
        type_month_year: {
          type: dto.type,
          month: dto.month,
          year: dto.year,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (existing) {
      // If the existing award is for the same user and is unpublished, republish it
      if (existing.userId === dto.userId && !existing.isPublished) {
        const republished = await this.prisma.monthlyAward.update({
          where: { id: existing.id },
          data: {
            reason: dto.reason || existing.reason,
            isPublished: dto.publishImmediately || false,
            publishedAt: dto.publishImmediately ? new Date() : null,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
              },
            },
          },
        });

        if (dto.publishImmediately) {
          await this.sendAwardNotification(republished);
        }

        return republished;
      }

      // If the existing award is already published, throw error
      if (existing.isPublished) {
        throw new ConflictException(
          `${AWARD_LABELS[dto.type]} for ${MONTH_NAMES[dto.month]} ${dto.year} has already been published to ${existing.user.firstName} ${existing.user.lastName}. Please unpublish it first to reassign.`,
        );
      }

      // If unpublished but for a different user, update the award to the new user
      const updated = await this.prisma.monthlyAward.update({
        where: { id: existing.id },
        data: {
          userId: dto.userId,
          reason: dto.reason,
          isPublished: dto.publishImmediately || false,
          publishedAt: dto.publishImmediately ? new Date() : null,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      if (dto.publishImmediately) {
        await this.sendAwardNotification(updated);
      }

      return updated;
    }

    // Verify user exists
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const award = await this.prisma.monthlyAward.create({
      data: {
        type: dto.type,
        userId: dto.userId,
        month: dto.month,
        year: dto.year,
        reason: dto.reason,
        isPublished: dto.publishImmediately || false,
        publishedAt: dto.publishImmediately ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (dto.publishImmediately) {
      await this.sendAwardNotification(award);
    }

    return award;
  }

  async publish(id: string) {
    const award = await this.prisma.monthlyAward.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    if (award.isPublished) {
      return award;
    }

    const updated = await this.prisma.monthlyAward.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    await this.sendAwardNotification(updated);

    return updated;
  }

  async unpublish(id: string) {
    const award = await this.prisma.monthlyAward.findUnique({ where: { id } });

    if (!award) {
      throw new NotFoundException('Award not found');
    }

    if (!award.isPublished) {
      return award;
    }

    return this.prisma.monthlyAward.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(query: { month?: number; year?: number; type?: AwardType; isPublished?: boolean }) {
    const where: any = {};
    if (query.month) where.month = query.month;
    if (query.year) where.year = query.year;
    if (query.type) where.type = query.type;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;

    return this.prisma.monthlyAward.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async getMyAwards(userId: string) {
    return this.prisma.monthlyAward.findMany({
      where: {
        userId,
        isPublished: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getCurrentMonthAwards() {
    const now = new Date();
    return this.prisma.monthlyAward.findMany({
      where: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  async getPublishedRealtorOfMonth() {
    const now = new Date();
    // Try current month first
    let award = await this.prisma.monthlyAward.findFirst({
      where: {
        type: 'REALTOR_OF_MONTH',
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        isPublished: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    return award;
  }

  async getPublishedOfMonth(type: AwardType) {
    const now = new Date();
    let award = await this.prisma.monthlyAward.findFirst({
      where: {
        type,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        isPublished: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
      },
    });

    return award;
  }

  async delete(id: string) {
    const award = await this.prisma.monthlyAward.findUnique({ where: { id } });
    if (!award) {
      throw new NotFoundException('Award not found');
    }
    return this.prisma.monthlyAward.delete({ where: { id } });
  }

  private async sendAwardNotification(award: any) {
    const label = AWARD_LABELS[award.type as AwardType];
    const monthName = MONTH_NAMES[award.month];

    await this.notificationService.create({
      userId: award.userId,
      type: 'AWARD',
      title: `Congratulations! You are ${label}!`,
      message: `You have been named ${label} for ${monthName} ${award.year}! ${award.reason}`,
      priority: 'HIGH',
      data: { awardId: award.id, awardType: award.type },
    });
  }
}
