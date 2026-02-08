import { IsString, IsOptional, IsInt, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Realty' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'acme-realty', description: 'URL-safe slug, lowercase' })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens, no leading/trailing hyphens',
  })
  slug: string;

  @ApiProperty({ example: 'acme-realty.com' })
  @IsString()
  domain: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: '#3b82f6' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;
}
