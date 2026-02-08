import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY, PermissionRequirement } from '../guards/staff-permission.guard';

export const Permissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
