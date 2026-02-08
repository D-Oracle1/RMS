import { IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GalleryItemType } from '@prisma/client';

export class GalleryQueryDto {
  @ApiProperty({ required: false, enum: GalleryItemType })
  @IsOptional()
  @IsEnum(GalleryItemType)
  type?: GalleryItemType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
