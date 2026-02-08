import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateAllowanceConfigDto,
  UpdateAllowanceConfigDto,
  CreateDeductionConfigDto,
  UpdateDeductionConfigDto,
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
  UpdateStaffSalaryDto,
  StaffPosition,
} from '../dto/salary-config.dto';

@Injectable()
export class SalaryConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================
  // ALLOWANCE CONFIGURATION
  // ===========================================

  async createAllowanceConfig(dto: CreateAllowanceConfigDto) {
    return this.prisma.allowanceConfig.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        amountType: dto.amountType,
        amount: dto.amount,
        percentageBasis: dto.percentageBasis,
        isActive: dto.isActive ?? true,
        positionLevels: dto.positionLevels || [],
        minServiceMonths: dto.minServiceMonths,
        isTaxable: dto.isTaxable ?? true,
      },
    });
  }

  async findAllAllowanceConfigs(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.allowanceConfig.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findAllowanceConfigById(id: string) {
    const config = await this.prisma.allowanceConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Allowance config not found');
    }
    return config;
  }

  async updateAllowanceConfig(id: string, dto: UpdateAllowanceConfigDto) {
    const config = await this.prisma.allowanceConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Allowance config not found');
    }

    return this.prisma.allowanceConfig.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAllowanceConfig(id: string) {
    const config = await this.prisma.allowanceConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Allowance config not found');
    }

    return this.prisma.allowanceConfig.delete({ where: { id } });
  }

  // ===========================================
  // DEDUCTION CONFIGURATION
  // ===========================================

  async createDeductionConfig(dto: CreateDeductionConfigDto) {
    return this.prisma.deductionConfig.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        amountType: dto.amountType,
        amount: dto.amount,
        percentageBasis: dto.percentageBasis,
        isActive: dto.isActive ?? true,
        isMandatory: dto.isMandatory ?? false,
        maxAmount: dto.maxAmount,
      },
    });
  }

  async findAllDeductionConfigs(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.deductionConfig.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findDeductionConfigById(id: string) {
    const config = await this.prisma.deductionConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Deduction config not found');
    }
    return config;
  }

  async updateDeductionConfig(id: string, dto: UpdateDeductionConfigDto) {
    const config = await this.prisma.deductionConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Deduction config not found');
    }

    return this.prisma.deductionConfig.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDeductionConfig(id: string) {
    const config = await this.prisma.deductionConfig.findUnique({ where: { id } });
    if (!config) {
      throw new NotFoundException('Deduction config not found');
    }

    return this.prisma.deductionConfig.delete({ where: { id } });
  }

  // ===========================================
  // SALARY STRUCTURE
  // ===========================================

  async createSalaryStructure(dto: CreateSalaryStructureDto) {
    // Check if position already has a structure
    const existing = await this.prisma.salaryStructure.findUnique({
      where: { position: dto.position },
    });

    if (existing) {
      throw new BadRequestException(`Salary structure for ${dto.position} already exists`);
    }

    return this.prisma.salaryStructure.create({
      data: {
        name: dto.name,
        description: dto.description,
        position: dto.position,
        minSalary: dto.minSalary,
        maxSalary: dto.maxSalary,
        workHoursPerDay: dto.workHoursPerDay ?? 8,
        workDaysPerWeek: dto.workDaysPerWeek ?? 5,
        overtimeRate: dto.overtimeRate ?? 1.5,
        weekendRate: dto.weekendRate ?? 2.0,
        holidayRate: dto.holidayRate ?? 2.5,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllSalaryStructures(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.salaryStructure.findMany({
      where,
      orderBy: { position: 'asc' },
    });
  }

  async findSalaryStructureById(id: string) {
    const structure = await this.prisma.salaryStructure.findUnique({ where: { id } });
    if (!structure) {
      throw new NotFoundException('Salary structure not found');
    }
    return structure;
  }

  async findSalaryStructureByPosition(position: StaffPosition) {
    return this.prisma.salaryStructure.findUnique({
      where: { position },
    });
  }

  async updateSalaryStructure(id: string, dto: UpdateSalaryStructureDto) {
    const structure = await this.prisma.salaryStructure.findUnique({ where: { id } });
    if (!structure) {
      throw new NotFoundException('Salary structure not found');
    }

    return this.prisma.salaryStructure.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSalaryStructure(id: string) {
    const structure = await this.prisma.salaryStructure.findUnique({ where: { id } });
    if (!structure) {
      throw new NotFoundException('Salary structure not found');
    }

    return this.prisma.salaryStructure.delete({ where: { id } });
  }

  // ===========================================
  // STAFF SALARY MANAGEMENT
  // ===========================================

  async updateStaffSalary(staffProfileId: string, dto: UpdateStaffSalaryDto) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    // Optional: Validate against salary structure
    const structure = await this.prisma.salaryStructure.findUnique({
      where: { position: staff.position },
    });

    if (structure && structure.isActive) {
      if (dto.baseSalary < Number(structure.minSalary) || dto.baseSalary > Number(structure.maxSalary)) {
        throw new BadRequestException(
          `Salary must be between ${structure.minSalary} and ${structure.maxSalary} for ${staff.position} position`,
        );
      }
    }

    return this.prisma.staffProfile.update({
      where: { id: staffProfileId },
      data: {
        baseSalary: dto.baseSalary,
        currency: dto.currency || staff.currency,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { name: true } },
      },
    });
  }

  // ===========================================
  // CALCULATE PAYROLL COMPONENTS
  // ===========================================

  async calculateAllowancesForStaff(staffProfileId: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    // Calculate months of service
    const serviceMonths = Math.floor(
      (Date.now() - staff.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );

    // Get applicable allowances
    const allowances = await this.prisma.allowanceConfig.findMany({
      where: {
        isActive: true,
        OR: [
          { positionLevels: { isEmpty: true } },
          { positionLevels: { has: staff.position } },
        ],
      },
    });

    const result: Record<string, number> = {};
    let totalAllowances = 0;

    for (const allowance of allowances) {
      // Check minimum service months
      if (allowance.minServiceMonths && serviceMonths < allowance.minServiceMonths) {
        continue;
      }

      let amount = Number(allowance.amount);

      if (allowance.amountType === 'percentage') {
        const baseSalary = Number(staff.baseSalary);
        amount = (baseSalary * Number(allowance.amount)) / 100;
      }

      result[allowance.name] = amount;
      totalAllowances += amount;
    }

    return { allowances: result, total: totalAllowances };
  }

  async calculateDeductionsForStaff(staffProfileId: string, grossPay: number) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    // Get applicable deductions
    const deductions = await this.prisma.deductionConfig.findMany({
      where: { isActive: true },
    });

    const result: Record<string, number> = {};
    let totalDeductions = 0;

    for (const deduction of deductions) {
      let amount = Number(deduction.amount);

      if (deduction.amountType === 'percentage') {
        let basis = grossPay;
        if (deduction.percentageBasis === 'base_salary') {
          basis = Number(staff.baseSalary);
        }

        amount = (basis * Number(deduction.amount)) / 100;

        // Apply cap if exists
        if (deduction.maxAmount && amount > Number(deduction.maxAmount)) {
          amount = Number(deduction.maxAmount);
        }
      }

      result[deduction.name] = amount;
      totalDeductions += amount;
    }

    return { deductions: result, total: totalDeductions };
  }

  // ===========================================
  // SUMMARY & REPORTS
  // ===========================================

  async getSalaryConfigSummary() {
    const [allowances, deductions, structures] = await Promise.all([
      this.prisma.allowanceConfig.count({ where: { isActive: true } }),
      this.prisma.deductionConfig.count({ where: { isActive: true } }),
      this.prisma.salaryStructure.count({ where: { isActive: true } }),
    ]);

    const mandatoryDeductions = await this.prisma.deductionConfig.findMany({
      where: { isActive: true, isMandatory: true },
    });

    return {
      activeAllowances: allowances,
      activeDeductions: deductions,
      activeSalaryStructures: structures,
      mandatoryDeductions: mandatoryDeductions.map((d) => ({
        name: d.name,
        type: d.type,
        amount: d.amount,
        amountType: d.amountType,
      })),
    };
  }
}
