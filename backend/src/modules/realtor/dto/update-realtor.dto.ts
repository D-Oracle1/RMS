import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateRealtorDto {
  @ApiPropertyOptional({ example: 'Century 21' })
  @IsOptional()
  @IsString()
  agency?: string;

  @ApiPropertyOptional({ example: 'Experienced realtor specializing in luxury homes' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: ['Residential', 'Luxury', 'Commercial'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];
}
