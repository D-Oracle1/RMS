import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendCalloutDto {
  @ApiProperty({ description: 'Target user ID to send callout to' })
  @IsString()
  targetUserId: string;

  @ApiProperty({ description: 'Optional message with the callout', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'Optional link to include with the callout', required: false })
  @IsOptional()
  @IsString()
  link?: string;
}

export class RespondCalloutDto {
  @ApiProperty({ description: 'Response message' })
  @IsString()
  response: string;
}
