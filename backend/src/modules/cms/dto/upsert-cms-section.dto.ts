import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertCmsSectionDto {
  @ApiProperty({ description: 'Section content as JSON object' })
  @IsObject()
  content: Record<string, any>;
}
