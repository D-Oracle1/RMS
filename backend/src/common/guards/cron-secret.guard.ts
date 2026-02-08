import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-cron-secret'];

    if (!process.env.CRON_SECRET) {
      throw new UnauthorizedException('CRON_SECRET not configured');
    }

    if (secret !== process.env.CRON_SECRET) {
      throw new UnauthorizedException('Invalid cron secret');
    }

    return true;
  }
}
