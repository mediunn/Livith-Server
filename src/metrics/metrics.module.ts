import { Module } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics', // 매트릭 엔드포인트
      defaultMetrics: {
        enabled: true, // Node.js 기본 메트릭 활성화
      },
    }),
  ],
  providers: [
    HttpMetricsInterceptor,
    makeCounterProvider({
      name: 'http_request_total',
      help: '총 HTTP 요청 수',
      labelNames: ['method', 'path', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: '요청 처리 시간 (초)',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    }),
    makeGaugeProvider({
      name: 'http_requests_in_flight',
      help: '현재 처리 중인 요청 수',
      labelNames: ['method', 'path'],
    }),
  ],
  exports: [PrometheusModule, HttpMetricsInterceptor],
})
export class MetricsModule {}
