import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, IsString, Min } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: '2026-02-15' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'BANK_TRANSFER' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'TRF-123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Second installment payment' })
  @IsOptional()
  @IsString()
  notes?: string;
}
