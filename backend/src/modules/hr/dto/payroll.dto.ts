import { IsString, IsOptional, IsDateString, IsNumber, IsObject, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayrollStatus } from '@prisma/client';

export class GeneratePayrollDto {
  @ApiProperty({ description: 'Period start date' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Period end date' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ description: 'Department IDs to include (all if empty)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  departmentIds?: string[];
}

export class UpdatePayrollDto {
  @ApiPropertyOptional({ description: 'Overtime amount' })
  @IsOptional()
  @IsNumber()
  overtime?: number;

  @ApiPropertyOptional({ description: 'Bonus amount' })
  @IsOptional()
  @IsNumber()
  bonus?: number;

  @ApiPropertyOptional({ description: 'Allowances object' })
  @IsOptional()
  @IsObject()
  allowances?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Other deductions object' })
  @IsOptional()
  @IsObject()
  otherDeductions?: Record<string, number>;
}

export class ApprovePayrollDto {
  @ApiPropertyOptional({ description: 'Pay date' })
  @IsOptional()
  @IsDateString()
  payDate?: string;
}

export class PayrollQueryDto {
  page?: number;
  limit?: number;
  staffProfileId?: string;
  departmentId?: string;
  status?: PayrollStatus;
  periodStart?: string;
  periodEnd?: string;
}
