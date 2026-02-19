import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '@prisma/client';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiPropertyOptional({ enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'] })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
