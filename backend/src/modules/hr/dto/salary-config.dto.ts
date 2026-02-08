import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AllowanceType {
  HOUSING = 'HOUSING',
  TRANSPORT = 'TRANSPORT',
  MEAL = 'MEAL',
  MEDICAL = 'MEDICAL',
  COMMUNICATION = 'COMMUNICATION',
  ENTERTAINMENT = 'ENTERTAINMENT',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER',
}

export enum DeductionType {
  TAX = 'TAX',
  PENSION = 'PENSION',
  HEALTH_INSURANCE = 'HEALTH_INSURANCE',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  LATENESS_PENALTY = 'LATENESS_PENALTY',
  ABSENCE_PENALTY = 'ABSENCE_PENALTY',
  LATE_TASK_PENALTY = 'LATE_TASK_PENALTY',
  OTHER = 'OTHER',
}

export enum StaffPosition {
  EXECUTIVE = 'EXECUTIVE',
  DIRECTOR = 'DIRECTOR',
  MANAGER = 'MANAGER',
  TEAM_LEAD = 'TEAM_LEAD',
  SENIOR = 'SENIOR',
  JUNIOR = 'JUNIOR',
  INTERN = 'INTERN',
}

// Allowance Config DTOs
export class CreateAllowanceConfigDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: AllowanceType })
  @IsEnum(AllowanceType)
  type: AllowanceType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '"fixed" or "percentage"' })
  @IsString()
  amountType: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  percentageBasis?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: StaffPosition, isArray: true })
  @IsArray()
  @IsEnum(StaffPosition, { each: true })
  @IsOptional()
  positionLevels?: StaffPosition[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minServiceMonths?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;
}

export class UpdateAllowanceConfigDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  amountType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  percentageBasis?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: StaffPosition, isArray: true })
  @IsArray()
  @IsOptional()
  positionLevels?: StaffPosition[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minServiceMonths?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isTaxable?: boolean;
}

// Deduction Config DTOs
export class CreateDeductionConfigDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: DeductionType })
  @IsEnum(DeductionType)
  type: DeductionType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '"fixed" or "percentage"' })
  @IsString()
  amountType: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  percentageBasis?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxAmount?: number;
}

export class UpdateDeductionConfigDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  amountType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  percentageBasis?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxAmount?: number;
}

// Salary Structure DTOs
export class CreateSalaryStructureDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: StaffPosition })
  @IsEnum(StaffPosition)
  position: StaffPosition;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  minSalary: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  maxSalary: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  workHoursPerDay?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  workDaysPerWeek?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  overtimeRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weekendRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  holidayRate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSalaryStructureDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minSalary?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxSalary?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  workHoursPerDay?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  workDaysPerWeek?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  overtimeRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weekendRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  holidayRate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// Update Staff Salary DTO
export class UpdateStaffSalaryDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;
}
