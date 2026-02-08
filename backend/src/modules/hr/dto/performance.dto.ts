import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewCycle, ReviewStatus } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ description: 'Staff profile ID of the reviewee' })
  @IsUUID()
  revieweeId: string;

  @ApiProperty({ enum: ReviewCycle, description: 'Review cycle' })
  @IsEnum(ReviewCycle)
  cycle: ReviewCycle;

  @ApiProperty({ description: 'Period start date' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Period end date' })
  @IsDateString()
  periodEnd: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ description: 'Overall rating (1-5)' })
  @IsOptional()
  @IsNumber()
  overallRating?: number;

  @ApiPropertyOptional({ description: 'Category ratings object' })
  @IsOptional()
  @IsObject()
  ratings?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Strengths' })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({ description: 'Areas for improvement' })
  @IsOptional()
  @IsString()
  areasForImprovement?: string;

  @ApiPropertyOptional({ description: 'Goals array' })
  @IsOptional()
  @IsObject()
  goals?: any[];

  @ApiPropertyOptional({ description: 'Reviewer comments' })
  @IsOptional()
  @IsString()
  reviewerComments?: string;
}

export class AcknowledgeReviewDto {
  @ApiPropertyOptional({ description: 'Reviewee comments on the review' })
  @IsOptional()
  @IsString()
  revieweeComments?: string;
}

export class ReviewQueryDto {
  page?: number;
  limit?: number;
  revieweeId?: string;
  reviewerId?: string;
  cycle?: ReviewCycle;
  status?: ReviewStatus;
}
