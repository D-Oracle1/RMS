import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty({ description: 'Email address to subscribe' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Subscriber name', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendNewsletterDto {
  @ApiProperty({ description: 'Email subject line' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Email HTML content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
