import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SharedFilesQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['personal', 'department', 'public'] })
  @IsOptional()
  @IsString()
  category?: 'personal' | 'department' | 'public';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;
}
