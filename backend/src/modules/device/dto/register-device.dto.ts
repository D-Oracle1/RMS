import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional, MaxLength } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'fcm-token-string' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  fcmToken: string;

  @ApiProperty({ example: 'web', enum: ['web', 'android', 'ios'] })
  @IsString()
  @IsIn(['web', 'android', 'ios'])
  deviceType: string;

  @ApiProperty({ example: 'Chrome on Windows', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;
}
