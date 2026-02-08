import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  CreatePenaltyDto,
  WaivePenaltyDto,
  PolicyQueryDto,
  PenaltyQueryDto,
  PolicyType,
} from '../dto/policy.dto';

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================
  // POLICY CRUD
  // ===========================================

  async createPolicy(dto: CreatePolicyDto) {
    return this.prisma.hRPolicy.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        isActive: dto.isActive ?? true,
        isAutomatic: dto.isAutomatic ?? true,
        penaltyType: dto.penaltyType,
        penaltyAmount: dto.penaltyAmount,
        penaltyBasis: dto.penaltyBasis,
        graceMinutes: dto.graceMinutes,
        maxOccurrences: dto.maxOccurrences,
        escalationRate: dto.escalationRate,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
    });
  }

  async findAllPolicies(query: PolicyQueryDto) {
    const { page = 1, limit = 50, type, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [policies, total] = await Promise.all([
      this.prisma.hRPolicy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.hRPolicy.count({ where }),
    ]);

    return {
      data: policies,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPolicyById(id: string) {
    const policy = await this.prisma.hRPolicy.findUnique({
      where: { id },
      include: {
        penalties: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return policy;
  }

  async updatePolicy(id: string, dto: UpdatePolicyDto) {
    const policy = await this.prisma.hRPolicy.findUnique({ where: { id } });
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    return this.prisma.hRPolicy.update({
      where: { id },
      data: {
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      },
    });
  }

  async deletePolicy(id: string) {
    const policy = await this.prisma.hRPolicy.findUnique({ where: { id } });
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Check if policy has been used
    const penaltyCount = await this.prisma.penaltyRecord.count({
      where: { policyId: id },
    });

    if (penaltyCount > 0) {
      // Soft delete by deactivating
      return this.prisma.hRPolicy.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.hRPolicy.delete({ where: { id } });
  }

  // ===========================================
  // PENALTY MANAGEMENT
  // ===========================================

  async createPenalty(dto: CreatePenaltyDto) {
    // Verify staff exists
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: dto.staffProfileId },
    });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    return this.prisma.penaltyRecord.create({
      data: {
        staffProfileId: dto.staffProfileId,
        policyId: dto.policyId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        occurredAt: new Date(dto.occurredAt),
      },
      include: {
        staffProfile: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        policy: true,
      },
    });
  }

  async findAllPenalties(query: PenaltyQueryDto) {
    const { page = 1, limit = 50, staffProfileId, type, isApplied, isWaived, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (staffProfileId) where.staffProfileId = staffProfileId;
    if (type) where.type = type;
    if (isApplied !== undefined) where.isApplied = isApplied;
    if (isWaived !== undefined) where.isWaived = isWaived;
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const [penalties, total] = await Promise.all([
      this.prisma.penaltyRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
        include: {
          staffProfile: {
            include: {
              user: { select: { firstName: true, lastName: true, avatar: true } },
              department: { select: { name: true } },
            },
          },
          policy: { select: { name: true, type: true } },
        },
      }),
      this.prisma.penaltyRecord.count({ where }),
    ]);

    return {
      data: penalties,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPenaltyById(id: string) {
    const penalty = await this.prisma.penaltyRecord.findUnique({
      where: { id },
      include: {
        staffProfile: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            department: true,
          },
        },
        policy: true,
      },
    });

    if (!penalty) {
      throw new NotFoundException('Penalty not found');
    }

    return penalty;
  }

  async waivePenalty(id: string, userId: string, dto: WaivePenaltyDto) {
    const penalty = await this.prisma.penaltyRecord.findUnique({ where: { id } });
    if (!penalty) {
      throw new NotFoundException('Penalty not found');
    }

    if (penalty.isApplied) {
      throw new BadRequestException('Cannot waive a penalty that has already been applied to payroll');
    }

    if (penalty.isWaived) {
      throw new BadRequestException('Penalty has already been waived');
    }

    return this.prisma.penaltyRecord.update({
      where: { id },
      data: {
        isWaived: true,
        waivedBy: userId,
        waivedAt: new Date(),
        waiverReason: dto.reason,
      },
    });
  }

  async applyPenaltyToPayroll(penaltyId: string, payrollId: string) {
    const penalty = await this.prisma.penaltyRecord.findUnique({ where: { id: penaltyId } });
    if (!penalty) {
      throw new NotFoundException('Penalty not found');
    }

    if (penalty.isWaived) {
      throw new BadRequestException('Cannot apply a waived penalty');
    }

    if (penalty.isApplied) {
      throw new BadRequestException('Penalty has already been applied');
    }

    return this.prisma.penaltyRecord.update({
      where: { id: penaltyId },
      data: {
        isApplied: true,
        appliedToPayrollId: payrollId,
        appliedAt: new Date(),
      },
    });
  }

  // ===========================================
  // AUTOMATIC PENALTY CALCULATION
  // ===========================================

  async calculateLatenessPenalty(staffProfileId: string, attendanceId: string, minutesLate: number) {
    // Find active lateness policy
    const policy = await this.prisma.hRPolicy.findFirst({
      where: {
        type: 'LATENESS',
        isActive: true,
        isAutomatic: true,
      },
    });

    if (!policy) return null;

    // Check grace period
    if (policy.graceMinutes && minutesLate <= policy.graceMinutes) {
      return null;
    }

    // Get staff salary for percentage calculation
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
    });

    if (!staff) return null;

    let penaltyAmount = Number(policy.penaltyAmount);

    if (policy.penaltyType === 'percentage') {
      const baseSalary = Number(staff.baseSalary);
      let basis = baseSalary;

      if (policy.penaltyBasis === 'daily_salary') {
        basis = baseSalary / 22; // Assuming 22 working days
      } else if (policy.penaltyBasis === 'hourly_rate') {
        basis = baseSalary / 22 / 8;
      }

      penaltyAmount = (basis * Number(policy.penaltyAmount)) / 100;
    }

    // Check for escalation based on occurrences this month
    if (policy.escalationRate) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const occurrences = await this.prisma.penaltyRecord.count({
        where: {
          staffProfileId,
          type: 'LATENESS',
          occurredAt: { gte: startOfMonth },
        },
      });

      if (occurrences > 0) {
        penaltyAmount *= Math.pow(policy.escalationRate, Math.min(occurrences, policy.maxOccurrences || 5));
      }
    }

    return this.prisma.penaltyRecord.create({
      data: {
        staffProfileId,
        policyId: policy.id,
        type: 'LATENESS',
        description: `Late arrival by ${minutesLate} minutes`,
        amount: penaltyAmount,
        referenceType: 'attendance',
        referenceId: attendanceId,
        occurredAt: new Date(),
      },
    });
  }

  async calculateLateTaskPenalty(staffProfileId: string, taskId: string, daysLate: number) {
    const policy = await this.prisma.hRPolicy.findFirst({
      where: {
        type: 'LATE_TASK',
        isActive: true,
        isAutomatic: true,
      },
    });

    if (!policy) return null;

    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
    });

    if (!staff) return null;

    let penaltyAmount = Number(policy.penaltyAmount);

    if (policy.penaltyType === 'percentage') {
      const baseSalary = Number(staff.baseSalary);
      let basis = baseSalary;

      if (policy.penaltyBasis === 'daily_salary') {
        basis = baseSalary / 22;
      }

      penaltyAmount = (basis * Number(policy.penaltyAmount)) / 100;
    }

    // Multiply by days late
    penaltyAmount *= daysLate;

    return this.prisma.penaltyRecord.create({
      data: {
        staffProfileId,
        policyId: policy.id,
        type: 'LATE_TASK',
        description: `Task submitted ${daysLate} day(s) late`,
        amount: penaltyAmount,
        referenceType: 'task',
        referenceId: taskId,
        occurredAt: new Date(),
      },
    });
  }

  async calculateAbsencePenalty(staffProfileId: string, attendanceId: string) {
    const policy = await this.prisma.hRPolicy.findFirst({
      where: {
        type: 'ABSENCE',
        isActive: true,
        isAutomatic: true,
      },
    });

    if (!policy) return null;

    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
    });

    if (!staff) return null;

    let penaltyAmount = Number(policy.penaltyAmount);

    if (policy.penaltyType === 'percentage') {
      const baseSalary = Number(staff.baseSalary);
      const dailySalary = baseSalary / 22;
      penaltyAmount = (dailySalary * Number(policy.penaltyAmount)) / 100;
    }

    return this.prisma.penaltyRecord.create({
      data: {
        staffProfileId,
        policyId: policy.id,
        type: 'ABSENCE',
        description: 'Unexcused absence',
        amount: penaltyAmount,
        referenceType: 'attendance',
        referenceId: attendanceId,
        occurredAt: new Date(),
      },
    });
  }

  // ===========================================
  // SUMMARY & REPORTS
  // ===========================================

  async getStaffPenaltySummary(staffProfileId: string, startDate?: string, endDate?: string) {
    const where: any = { staffProfileId };

    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    const penalties = await this.prisma.penaltyRecord.findMany({
      where,
      include: { policy: true },
    });

    const summary = {
      totalPenalties: penalties.length,
      totalAmount: 0,
      appliedAmount: 0,
      waivedAmount: 0,
      pendingAmount: 0,
      byType: {} as Record<string, { count: number; amount: number }>,
    };

    for (const penalty of penalties) {
      const amount = Number(penalty.amount);
      summary.totalAmount += amount;

      if (penalty.isWaived) {
        summary.waivedAmount += amount;
      } else if (penalty.isApplied) {
        summary.appliedAmount += amount;
      } else {
        summary.pendingAmount += amount;
      }

      if (!summary.byType[penalty.type]) {
        summary.byType[penalty.type] = { count: 0, amount: 0 };
      }
      summary.byType[penalty.type].count++;
      summary.byType[penalty.type].amount += amount;
    }

    return summary;
  }

  async getPendingPenaltiesForPayroll(staffProfileId: string) {
    return this.prisma.penaltyRecord.findMany({
      where: {
        staffProfileId,
        isApplied: false,
        isWaived: false,
      },
      include: { policy: true },
      orderBy: { occurredAt: 'desc' },
    });
  }
}
