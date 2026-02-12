import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../database/prisma.service';
import { PusherService } from '../../common/services/pusher.service';
import { SmsService } from '../../common/services/sms.service';
import { PushNotificationService } from '../../common/services/push-notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: any;
  let pusherService: any;
  let smsService: any;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userDevice: {
      findMany: jest.fn(),
    },
  };

  const mockPusherService = {
    sendToUser: jest.fn(),
    sendToRole: jest.fn(),
  };

  const mockSmsService = {
    sendUrgentNotification: jest.fn(),
  };

  const mockPushNotificationService = {
    sendToTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PusherService, useValue: mockPusherService },
        { provide: SmsService, useValue: mockSmsService },
        { provide: PushNotificationService, useValue: mockPushNotificationService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = mockPrisma;
    pusherService = mockPusherService;
    smsService = mockSmsService;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const notificationData = {
      userId: 'user-1',
      type: 'SALE' as any,
      title: 'New Sale',
      message: 'A new sale was recorded',
      priority: 'MEDIUM' as any,
    };

    it('should create a notification in the database', async () => {
      const mockNotification = { id: 'notif-1', ...notificationData };
      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.userDevice.findMany.mockResolvedValue([]);

      const result = await service.create(notificationData);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'SALE',
          title: 'New Sale',
        }),
      });
      expect(result).toEqual(mockNotification);
    });

    it('should send real-time notification via Pusher', async () => {
      const mockNotification = { id: 'notif-1', ...notificationData };
      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.userDevice.findMany.mockResolvedValue([]);

      await service.create(notificationData);

      expect(pusherService.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:new',
        mockNotification,
      );
    });

    it('should send SMS for URGENT priority notifications', async () => {
      const urgentData = { ...notificationData, priority: 'URGENT' as any };
      const mockNotification = { id: 'notif-1', ...urgentData };
      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.user.findUnique.mockResolvedValue({ phone: '+1234567890' });
      prisma.userDevice.findMany.mockResolvedValue([]);

      await service.create(urgentData);

      expect(smsService.sendUrgentNotification).toHaveBeenCalledWith(
        '+1234567890',
        'New Sale',
        'A new sale was recorded',
      );
    });

    it('should not send SMS for non-URGENT notifications', async () => {
      const mockNotification = { id: 'notif-1', ...notificationData };
      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.userDevice.findMany.mockResolvedValue([]);

      await service.create(notificationData);

      expect(smsService.sendUrgentNotification).not.toHaveBeenCalled();
    });

    it('should send push notifications to registered devices', async () => {
      const mockNotification = { id: 'notif-1', ...notificationData };
      prisma.notification.create.mockResolvedValue(mockNotification);
      prisma.userDevice.findMany.mockResolvedValue([
        { fcmToken: 'token-1' },
        { fcmToken: 'token-2' },
      ]);

      await service.create(notificationData);

      expect(mockPushNotificationService.sendToTokens).toHaveBeenCalledWith(
        ['token-1', 'token-2'],
        expect.objectContaining({ title: 'New Sale' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications with unread count', async () => {
      const mockNotifications = [
        { id: 'n1', title: 'Test 1' },
        { id: 'n2', title: 'Test 2' },
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications);
      prisma.notification.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3); // unread

      const result = await service.findAll('user-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(10);
      expect(result.meta.unreadCount).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('notif-1', 'user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', userId: 'user-1' },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead('user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });
});
