import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CampaignType,
  AudienceType,
  ScheduleType,
  CampaignTone,
  SubscriberRole,
} from '../enums';

// ==========================================
// SUBSCRIBER DTOs
// ==========================================

export class CreateSubscriberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: SubscriberRole })
  @IsOptional()
  @IsEnum(SubscriberRole)
  role?: SubscriberRole;
}

export class UpdateSubscriberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: SubscriberRole })
  @IsOptional()
  @IsEnum(SubscriberRole)
  role?: SubscriberRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSubscribed?: boolean;
}

// ==========================================
// CAMPAIGN DTOs
// ==========================================

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: CampaignType })
  @IsEnum(CampaignType)
  campaignType: CampaignType;

  @ApiPropertyOptional({ enum: AudienceType })
  @IsOptional()
  @IsEnum(AudienceType)
  audienceType?: AudienceType;

  @ApiPropertyOptional({ enum: ScheduleType })
  @IsOptional()
  @IsEnum(ScheduleType)
  scheduleType?: ScheduleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Cron expression for recurring campaigns' })
  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @ApiPropertyOptional({ enum: CampaignTone })
  @IsOptional()
  @IsEnum(CampaignTone)
  tone?: CampaignTone;

  @ApiPropertyOptional({ description: 'Pre-written HTML content (skips AI generation)' })
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: AudienceType })
  @IsOptional()
  @IsEnum(AudienceType)
  audienceType?: AudienceType;

  @ApiPropertyOptional({ enum: CampaignTone })
  @IsOptional()
  @IsEnum(CampaignTone)
  tone?: CampaignTone;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  htmlContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}

// ==========================================
// NOTIFICATION DTOs
// ==========================================

export class CreatePopupNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ enum: AudienceType })
  @IsOptional()
  @IsEnum(AudienceType)
  targetRole?: AudienceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

// ==========================================
// AI TEMPLATE DTOs
// ==========================================

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  promptTemplate: string;

  @ApiPropertyOptional({ enum: CampaignTone })
  @IsOptional()
  @IsEnum(CampaignTone)
  tone?: CampaignTone;
}

// ==========================================
// QUERY DTOs
// ==========================================

export class CampaignQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: CampaignType })
  @IsOptional()
  @IsEnum(CampaignType)
  campaignType?: CampaignType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class SubscriberQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SubscriberRole })
  @IsOptional()
  @IsEnum(SubscriberRole)
  role?: SubscriberRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string; // 'active' | 'unsubscribed'
}
