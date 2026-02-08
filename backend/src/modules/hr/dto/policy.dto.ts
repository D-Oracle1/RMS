import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PolicyType {
  LATENESS = 'LATENESS',
  ABSENCE = 'ABSENCE',
  LATE_TASK = 'LATE_TASK',
  EARLY_DEPARTURE = 'EARLY_DEPARTURE',
  DRESS_CODE = 'DRESS_CODE',
  MISCONDUCT = 'MISCONDUCT',
  OTHER = 'OTHER',
}

export class CreatePolicyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: PolicyType })
  @IsEnum(PolicyType)
  type: PolicyType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAutomatic?: boolean;

  @ApiProperty({ description: '"fixed" or "percentage"' })
  @IsString()
  penaltyType: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  penaltyAmount: number;

  @ApiPropertyOptional({ description: '"daily_salary", "monthly_salary", "hourly_rate"' })
  @IsString()
  @IsOptional()
  penaltyBasis?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  graceMinutes?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxOccurrences?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  escalationRate?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class UpdatePolicyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAutomatic?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  penaltyType?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  penaltyAmount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  penaltyBasis?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  graceMinutes?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxOccurrences?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  escalationRate?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;
}

export class CreatePenaltyDto {
  @ApiProperty()
  @IsString()
  staffProfileId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  policyId?: string;

  @ApiProperty({ enum: PolicyType })
  @IsEnum(PolicyType)
  type: PolicyType;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty()
  @IsDateString()
  occurredAt: string;
}

export class WaivePenaltyDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class PolicyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: PolicyType })
  @IsEnum(PolicyType)
  @IsOptional()
  type?: PolicyType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class PenaltyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  staffProfileId?: string;

  @ApiPropertyOptional({ enum: PolicyType })
  @IsEnum(PolicyType)
  @IsOptional()
  type?: PolicyType;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isApplied?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isWaived?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
