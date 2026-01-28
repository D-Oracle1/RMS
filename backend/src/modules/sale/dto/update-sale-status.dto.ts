import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SaleStatus } from '@prisma/client';

export class UpdateSaleStatusDto {
  @ApiProperty({ enum: SaleStatus, description: 'New status for the sale' })
  @IsEnum(SaleStatus)
  status: SaleStatus;

  @ApiPropertyOptional({ description: 'Notes about the status change' })
  @IsOptional()
  @IsString()
  notes?: string;
}
