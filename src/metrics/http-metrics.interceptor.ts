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
          const statusCode = String(response.statusCode);
          this.requestCounter.inc({ method, route, status_code: statusCode });
          endTimer({ status_code: statusCode });
        },
        error: (error) => {
          const statusCode = String(error.status ?? 500);
          this.requestCounter.inc({ method, route, status_code: statusCode });
          endTimer({ status_code: statusCode });
        },
      }),
      finalize(() => this.requestsInFlight.dec({ method, route })),
    );
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
