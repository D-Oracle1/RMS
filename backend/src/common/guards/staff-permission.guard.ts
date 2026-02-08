import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';

export interface PermissionRequirement {
  resource: string;
  action: string;
}

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class StaffPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super admins and admins bypass permission checks
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return true;
    }

    // For staff members, check their permissions
    if (user.role === 'STAFF') {
      const staffProfile = await this.prisma.staffProfile.findUnique({
        where: { userId: user.id },
        include: { permissions: true },
      });

      if (!staffProfile) {
        throw new ForbiddenException('Staff profile not found');
      }

      // Check if staff has all required permissions
      const hasAllPermissions = requiredPermissions.every((required) =>
        staffProfile.permissions.some(
          (p) =>
            p.resource === required.resource &&
            (p.action === required.action || p.action === 'manage'),
        ),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Missing required permissions: ${requiredPermissions
            .map((p) => `${p.resource}:${p.action}`)
            .join(', ')}`,
        );
      }

      // Attach staff profile to request for scope checking in services
      request.staffProfile = staffProfile;
      return true;
    }

    // Other roles don't have staff permissions
    throw new ForbiddenException('Access denied');
  }
}
