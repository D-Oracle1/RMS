import { Controller, Post, Delete, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeviceService } from './device.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NoAudit } from '../../common/decorators/audit.decorator';

@Controller('devices')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly configService: ConfigService,
  ) {}

  @Get('vapid-public-key')
  @NoAudit()
  getVapidPublicKey() {
    return { publicKey: this.configService.get<string>('webPush.publicKey') || '' };
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @NoAudit()
  async register(
    @Req() req: any,
    @Body() body: RegisterDeviceDto,
  ) {
    return this.deviceService.registerDevice(req.user.id, body);
  }

  @Delete(':token')
  @UseGuards(JwtAuthGuard)
  @NoAudit()
  async unregister(@Req() req: any, @Param('token') token: string) {
    return this.deviceService.unregisterDevice(token, req.user.id);
  }
}
