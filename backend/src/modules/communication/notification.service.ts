import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePopupNotificationDto } from './dto';
import { AudienceType } from './enums';

@Injectable()
export class PopupNotificationService {
  private readonly logger = new Logger(PopupNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new popup notification.
   */
  async create(dto: CreatePopupNotificationDto, tenantId?: string) {
    const notification = await this.prisma.popupNotification.create({
      data: {
        tenantId,
        title: dto.title,
        message: dto.message,
        targetRole: dto.targetRole || AudienceType.ALL,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });

    this.logger.log(`Popup notification created: ${notification.title}`);
    return notification;
  }

  /**
   * Get active notifications for a specific user role.
   */
  async getActiveForUser(userId: string, userRole: string) {
    const now = new Date();

    // Map user role to audience type
    const audienceFilter = this.mapRoleToAudience(userRole);

    const notifications = await this.prisma.popupNotification.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
        targetRole: { in: [AudienceType.ALL, ...audienceFilter] },
        NOT: {
          dismissedBy: { has: userId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications;
  }

  /**
   * Dismiss a notification for a user.
   */
  async dismiss(notificationId: string, userId: string) {
    const notification = await this.prisma.popupNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.dismissedBy.includes(userId)) {
      return { message: 'Already dismissed' };
    }

    await this.prisma.popupNotification.update({
      where: { id: notificationId },
      data: {
        dismissedBy: { push: userId },
      },
    });

    return { message: 'Notification dismissed' };
  }

  /**
   * Get all notifications (admin view) with pagination.
   */
  async findAll(query: { page?: number; limit?: number; active?: boolean }) {
    const { page = 1, limit = 20, active } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (active !== undefined) where.isActive = active;

    const [notifications, total] = await Promise.all([
      this.prisma.popupNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.popupNotification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Deactivate a notification.
   */
  async deactivate(id: string) {
    const notification = await this.prisma.popupNotification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.popupNotification.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete a notification.
   */
  async remove(id: string) {
    const notification = await this.prisma.popupNotification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.prisma.popupNotification.delete({ where: { id } });
    return { message: 'Notification deleted' };
  }

  /**
   * Map user role to audience types they should see.
   */
  private mapRoleToAudience(role: string): AudienceType[] {
    const mapping: Record<string, AudienceType[]> = {
      CLIENT: [AudienceType.CLIENT],
      REALTOR: [AudienceType.REALTOR],
      ADMIN: [AudienceType.STAFF],
      STAFF: [AudienceType.STAFF],
      SUPER_ADMIN: [AudienceType.STAFF],
      GENERAL_OVERSEER: [AudienceType.STAFF],
    };
    return mapping[role] || [];
  }
}
