import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignPermissionDto {
  @ApiProperty({ description: 'Resource name (e.g., properties, sales, clients, staff)' })
  @IsString()
  resource: string;

  @ApiProperty({ description: 'Action (e.g., read, write, delete, manage)' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Scope (e.g., own_department, all, team)' })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class BulkAssignPermissionsDto {
  @ApiProperty({ type: [AssignPermissionDto], description: 'List of permissions to assign' })
  @IsArray()
  permissions: AssignPermissionDto[];
}
