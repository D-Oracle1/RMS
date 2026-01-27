import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEmail, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateSaleDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  clientName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  clientEmail: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  clientContact?: string;

  @ApiProperty({ example: 'property-uuid' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 850000 })
  @IsNumber()
  @Min(0)
  saleValue: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  saleDate: string;

  @ApiPropertyOptional({ example: 'First-time buyer, smooth transaction' })
  @IsOptional()
  @IsString()
  notes?: string;
}
