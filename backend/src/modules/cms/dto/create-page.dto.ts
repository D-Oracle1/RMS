import { IsString, IsEnum, IsOptional, IsObject, Matches, MaxLength } from 'class-validator';
import { ContentType } from '@prisma/client';

export class CreatePageDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens (e.g. "my-page-title")',
  })
  slug: string;

  @IsEnum(ContentType)
  type: ContentType;

  @IsObject()
  content: any;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
