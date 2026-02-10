import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_total')
    private readonly requestCounter: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,

    @InjectMetric('http_requests_in_flight')
    private readonly requestsInFlight: Gauge<string>,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, path } = request;

    if (path === '/metrics') {
      return next.handle();
    }

    this.requestsInFlight.inc({ method, path });
    const endTimer = this.requestDuration.startTimer({ method, path });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const statusCode = String(response.statusCode);
          this.requestCounter.inc({ method, path, status_code: statusCode });
          endTimer({ status_code: statusCode });
          this.requestsInFlight.dec({ method, path });
        },
        error: (error) => {
          const statusCode = String(error.status ?? 500);
          this.requestCounter.inc({ method, path, status_code: statusCode });
          endTimer({ status_code: statusCode });
          this.requestsInFlight.dec({ method, path });
        },
      }),
    );
  }
}
