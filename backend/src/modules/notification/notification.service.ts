import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { WebsocketGateway } from '../../websocket/websocket.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WebsocketGateway))
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType | string;
    title: string;
    message: string;
    priority?: NotificationPriority | string;
    data?: any;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as NotificationType,
        title: data.title,
        message: data.message,
        priority: (data.priority || 'MEDIUM') as NotificationPriority,
        data: data.data,
        link: data.link,
      },
    });

    // Send real-time notification via WebSocket
    this.websocketGateway.sendToUser(data.userId, 'notification:new', notification);

    return notification;
  }

  async findAll(userId: string, query: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationType;
  }) {
    const { page = 1, limit = 20, isRead, type } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Notification helpers for specific events
  async notifySale(data: {
    realtorName: string;
    propertyTitle: string;
    saleAmount: number;
    saleId: string;
    propertyId: string;
    realtorId: string;
  }) {
    // Notify all admins
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });

    for (const admin of admins) {
      await this.create({
        userId: admin.id,
        type: NotificationType.SALE,
        title: 'New Sale Recorded',
        message: `${data.realtorName} sold ${data.propertyTitle} for $${data.saleAmount.toLocaleString()}`,
        priority: NotificationPriority.HIGH,
        data: {
          saleId: data.saleId,
          propertyId: data.propertyId,
          realtorId: data.realtorId,
        },
        link: `/admin/sales/${data.saleId}`,
      });
    }
  }

  async notifyRankingChange(data: {
    realtorId: string;
    userId: string;
    newRank: number;
    previousRank: number;
  }) {
    const direction = data.newRank < data.previousRank ? 'up' : 'down';
    const change = Math.abs(data.newRank - data.previousRank);

    await this.create({
      userId: data.userId,
      type: NotificationType.RANKING,
      title: 'Ranking Update',
      message: `Your ranking moved ${direction} by ${change} position${change > 1 ? 's' : ''}. You're now #${data.newRank}!`,
      priority: NotificationPriority.MEDIUM,
      data: {
        realtorId: data.realtorId,
        newRank: data.newRank,
        previousRank: data.previousRank,
      },
      link: '/dashboard/rankings',
    });
  }

  async notifyLoyaltyTierChange(data: {
    userId: string;
    newTier: string;
    previousTier: string;
  }) {
    await this.create({
      userId: data.userId,
      type: NotificationType.LOYALTY,
      title: 'Tier Upgrade!',
      message: `Congratulations! You've been promoted from ${data.previousTier} to ${data.newTier} tier!`,
      priority: NotificationPriority.HIGH,
      data: {
        newTier: data.newTier,
        previousTier: data.previousTier,
      },
      link: '/dashboard/loyalty',
    });
  }

  async notifyNewOffer(data: {
    ownerId: string;
    propertyTitle: string;
    offerAmount: number;
    offerId: string;
    propertyId: string;
  }) {
    await this.create({
      userId: data.ownerId,
      type: NotificationType.OFFER,
      title: 'New Offer Received',
      message: `You received an offer of $${data.offerAmount.toLocaleString()} for ${data.propertyTitle}`,
      priority: NotificationPriority.HIGH,
      data: {
        offerId: data.offerId,
        propertyId: data.propertyId,
      },
      link: `/dashboard/properties/${data.propertyId}/offers`,
    });
  }

  async notifyPriceChange(data: {
    subscriberIds: string[];
    propertyTitle: string;
    oldPrice: number;
    newPrice: number;
    propertyId: string;
  }) {
    for (const userId of data.subscriberIds) {
      await this.create({
        userId,
        type: NotificationType.PRICE_CHANGE,
        title: 'Price Change Alert',
        message: `${data.propertyTitle} price changed from $${data.oldPrice.toLocaleString()} to $${data.newPrice.toLocaleString()}`,
        priority: NotificationPriority.MEDIUM,
        data: {
          propertyId: data.propertyId,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
        },
        link: `/properties/${data.propertyId}`,
      });
    }
  }
}
