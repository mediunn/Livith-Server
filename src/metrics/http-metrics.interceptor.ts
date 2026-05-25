import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import { Request, Response } from 'express';
import { finalize, Observable } from 'rxjs';
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
    const { method } = request;

    if (request.path === '/metrics') {
      return next.handle();
    }

    const route = this.getRoutePattern(context);

    this.requestsInFlight.inc({ method, route });
    const endTimer = this.requestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const statusClass = this.getStatusClass(response.statusCode);
          this.requestCounter.inc({ method, route, status_class: statusClass });
          endTimer();
        },
        error: (error) => {
          const statusClass = this.getStatusClass(error.status ?? 500);
          this.requestCounter.inc({ method, route, status_class: statusClass });
          endTimer();
        },
      }),
      finalize(() => this.requestsInFlight.dec({ method, route })),
    );
  }

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500 && statusCode < 600) return '5xx';
    return 'other';
  }

  private getRoutePattern(context: ExecutionContext): string {
    const controllerPath =
      Reflect.getMetadata(PATH_METADATA, context.getClass()) ?? '';
    const handlerPath =
      Reflect.getMetadata(PATH_METADATA, context.getHandler()) ?? '';

    return (
      '/' +
      [controllerPath, handlerPath]
        .flat()
        .filter((segment) => segment && segment !== '/')
        .join('/')
    );
  }
}
