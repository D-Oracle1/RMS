import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, data: {
    fcmToken: string;
    deviceType: string;
    deviceName?: string;
  }) {
    return this.prisma.userDevice.upsert({
      where: { fcmToken: data.fcmToken },
      update: {
        userId,
        deviceType: data.deviceType,
        deviceName: data.deviceName,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        fcmToken: data.fcmToken,
        deviceType: data.deviceType,
        deviceName: data.deviceName,
      },
    });
  }

  async unregisterDevice(fcmToken: string, userId: string) {
    const device = await this.prisma.userDevice.findUnique({ where: { fcmToken } });
    if (!device) {
      return { success: true };
    }
    if (device.userId !== userId) {
      throw new ForbiddenException('You can only unregister your own devices');
    }
    await this.prisma.userDevice.delete({ where: { fcmToken } });
    return { success: true };
  }

  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      select: { fcmToken: true },
    });
    return devices.map((d: { fcmToken: string }) => d.fcmToken);
  }
}
