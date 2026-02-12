import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = mockPrisma;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

      await service.log({
        userId: 'user-1',
        action: 'CREATE',
        entity: 'properties',
        entityId: 'prop-1',
        newValue: { title: 'New Property' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          action: 'CREATE',
          entity: 'properties',
          entityId: 'prop-1',
        }),
      });
    });

    it('should not throw when database fails', async () => {
      prisma.auditLog.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.log({
          userId: 'user-1',
          action: 'CREATE',
          entity: 'test',
          entityId: '1',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('query', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        { id: 'a1', action: 'CREATE', entity: 'properties', user: { firstName: 'John' } },
        { id: 'a2', action: 'UPDATE', entity: 'sales', user: { firstName: 'Jane' } },
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(25);

      const result = await service.query({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should apply entity filter', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      await service.query({ entity: 'properties' });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entity: 'properties' }),
        }),
      );
    });

    it('should apply date range filter', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await service.query({ startDate, endDate });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        }),
      );
    });
  });
});
