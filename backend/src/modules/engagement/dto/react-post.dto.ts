import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';

export class ReactPostDto {
  @ApiProperty({ enum: ['HELPFUL', 'INSIGHTFUL', 'GAME_CHANGER'] })
  @IsEnum(ReactionType)
  type: ReactionType;
}
