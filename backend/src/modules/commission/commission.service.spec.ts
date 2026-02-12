import { Test, TestingModule } from '@nestjs/testing';
import { CommissionService } from './commission.service';
import { PrismaService } from '../../database/prisma.service';
import { SettingsService } from '../settings/settings.service';

describe('CommissionService', () => {
  let service: CommissionService;
  let prisma: any;

  const mockPrisma = {
    commission: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockSettingsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<CommissionService>(CommissionService);
    prisma = mockPrisma;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCommissionRate', () => {
    it('should return 3% for BRONZE tier', () => {
      expect(service.getCommissionRate('BRONZE' as any)).toBe(0.03);
    });

    it('should return 3.5% for SILVER tier', () => {
      expect(service.getCommissionRate('SILVER' as any)).toBe(0.035);
    });

    it('should return 4% for GOLD tier', () => {
      expect(service.getCommissionRate('GOLD' as any)).toBe(0.04);
    });

    it('should return 5% for PLATINUM tier', () => {
      expect(service.getCommissionRate('PLATINUM' as any)).toBe(0.05);
    });
  });

  describe('create', () => {
    it('should create a commission record', async () => {
      const commissionData = {
        saleId: 'sale-1',
        realtorId: 'realtor-1',
        amount: 15000,
        rate: 0.03,
      };

      prisma.commission.create.mockResolvedValue({
        id: 'comm-1',
        ...commissionData,
        status: 'PENDING',
      });

      const result = await service.create(commissionData);

      expect(result.id).toBe('comm-1');
      expect(result.amount).toBe(15000);
      expect(prisma.commission.create).toHaveBeenCalled();
    });
  });

  describe('markAsPaid', () => {
    it('should update commission status to PAID', async () => {
      prisma.commission.findUnique.mockResolvedValue({
        id: 'comm-1',
        status: 'PENDING',
      });
      prisma.commission.update.mockResolvedValue({
        id: 'comm-1',
        status: 'PAID',
        paidAt: expect.any(Date),
      });

      const result = await service.markAsPaid('comm-1');

      expect(prisma.commission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comm-1' },
          data: expect.objectContaining({ status: 'PAID' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated commissions', async () => {
      prisma.commission.findMany.mockResolvedValue([
        { id: 'c1', amount: 10000 },
        { id: 'c2', amount: 15000 },
      ]);
      prisma.commission.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });
  });
});
