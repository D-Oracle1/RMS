import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../services/audit.service';
import { NO_AUDIT_KEY } from '../decorators/audit.decorator';

const SENSITIVE_FIELDS = new Set([
  'password', 'newPassword', 'oldPassword', 'currentPassword', 'confirmPassword',
  'token', 'refreshToken', 'accessToken', 'secret', 'apiKey',
  'creditCard', 'cardNumber', 'cvv', 'ssn',
]);

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method } = request;

    // Only audit write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip if @NoAudit() decorator is present
    const noAudit = this.reflector.getAllAndOverride<boolean>(NO_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (noAudit) {
      return next.handle();
    }

    const user = request.user;
    // Skip if no authenticated user (public routes)
    if (!user?.id) {
      return next.handle();
    }

    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    const action = actionMap[method] || method;

    // Extract entity and entityId from path: /api/v1/{entity}/{entityId}
    const pathParts = (request.route?.path || request.path || '')
      .split('/')
      .filter(Boolean);
    // Handle versioned paths: api/v1/entity or api/entity
    const entityIndex = pathParts.findIndex((p: string) => p.startsWith('v')) + 1 || 2;
    const entity = pathParts[entityIndex] || 'unknown';
    const entityId = request.params?.id || pathParts[entityIndex + 1] || 'new';

    return next.handle().pipe(
      tap(() => {
        // Fire-and-forget audit log
        this.auditService.log({
          userId: user.id,
          action,
          entity,
          entityId: String(entityId),
          newValue: action !== 'DELETE' ? sanitizeBody(request.body) : undefined,
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
        });
      }),
    );
  }
}
