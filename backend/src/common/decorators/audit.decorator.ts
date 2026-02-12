import { SetMetadata } from '@nestjs/common';

export const NO_AUDIT_KEY = 'no_audit';
export const NoAudit = () => SetMetadata(NO_AUDIT_KEY, true);
