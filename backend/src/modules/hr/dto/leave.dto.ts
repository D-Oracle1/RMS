import { IsString, IsOptional, IsEnum, IsDateString, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType, LeaveStatus } from '@prisma/client';

export class CreateLeaveRequestDto {
  @ApiProperty({ enum: LeaveType, description: 'Type of leave' })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ description: 'Start date of leave' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of leave' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Reason for leave' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Attachment URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class ApproveLeaveDto {
  @ApiPropertyOptional({ description: 'Optional comment on approval' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectLeaveDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  reason: string;
}

export class LeaveQueryDto {
  page?: number;
  limit?: number;
  staffProfileId?: string;
  departmentId?: string;
  type?: LeaveType;
  status?: LeaveStatus;
  startDate?: string;
  endDate?: string;
}
