import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GalleryItemType } from '@prisma/client';

export class CreateGalleryItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: GalleryItemType })
  @IsEnum(GalleryItemType)
  type: GalleryItemType;

  @ApiProperty({ description: 'File URL path' })
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
