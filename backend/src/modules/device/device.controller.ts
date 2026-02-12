import { Controller, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeviceService } from './device.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NoAudit } from '../../common/decorators/audit.decorator';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post('register')
  @NoAudit()
  async register(
    @Req() req: any,
    @Body() body: RegisterDeviceDto,
  ) {
    return this.deviceService.registerDevice(req.user.id, body);
  }

  @Delete(':token')
  @NoAudit()
  async unregister(@Req() req: any, @Param('token') token: string) {
    return this.deviceService.unregisterDevice(token, req.user.id);
  }
}
