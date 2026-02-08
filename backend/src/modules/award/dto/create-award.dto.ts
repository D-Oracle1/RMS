import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { AwardType } from '@prisma/client';

export class CreateAwardDto {
  @ApiProperty({ enum: AwardType })
  @IsEnum(AwardType)
  type: AwardType;

  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  year: number;

  @ApiProperty({ example: 'Processed 156 transactions with zero errors' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  publishImmediately?: boolean;
}
