import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'Department name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Department code (unique identifier)' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Department description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent department ID for hierarchy' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Department head (Staff Profile ID)' })
  @IsOptional()
  @IsUUID()
  headId?: string;
}
