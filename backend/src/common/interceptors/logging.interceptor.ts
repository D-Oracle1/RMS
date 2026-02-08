import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const now = Date.now();
    const userId = user?.id || 'anonymous';

    this.logger.log(
      `[${method}] ${url} - User: ${userId} - Request started`,
    );

    return (next.handle() as any).pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - now;

          this.logger.log(
            `[${method}] ${url} - User: ${userId} - ${statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - now;
          this.logger.error(
            `[${method}] ${url} - User: ${userId} - Error: ${error.message} - ${duration}ms`,
          );
        },
      }),
    );
  }
}
