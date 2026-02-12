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
    makeHistogramProvider({
      name: 'db_query_duration_seconds',
      help: '쿼리 실행 시간 (초)',
      labelNames: ['operation', 'model', 'success'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    makeCounterProvider({
      name: 'db_query_total',
      help: '총 쿼리 수',
      labelNames: ['operation', 'model', 'success'],
    }),
    makeCounterProvider({
      name: 'db_slow_query_total',
      help: '슬로우 쿼리 수 (1초 이상)',
      labelNames: ['operation', 'model'],
    }),
    makeCounterProvider({
      name: 'fcm_notification_sent_total',
      help: '발송된 알림 수',
      labelNames: ['notification_type'],
    }),
    makeCounterProvider({
      name: 'fcm_notification_success_total',
      help: '발송 성공 수',
      labelNames: ['notification_type'],
    }),
    makeCounterProvider({
      name: 'fcm_notification_failure_total',
      help: '발송 실패 수',
      labelNames: ['notification_type'],
    }),
    makeHistogramProvider({
      name: 'fcm_send_duration_seconds',
      help: 'FCM 발송 소요 시간',
      labelNames: ['notification_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    }),
    makeHistogramProvider({
      name: 'fcm_batch_size',
      help: '배치당 발송 수',
      labelNames: ['notification_type'],
      buckets: [1, 10, 50, 100, 200, 500],
    }),
    makeCounterProvider({
      name: 'scheduler_job_execution_total',
      help: '스케줄러 실행 횟수',
      labelNames: ['job_name'],
    }),
    makeHistogramProvider({
      name: 'scheduler_job_duration_seconds',
      help: '스케줄러 실행 시간',
      labelNames: ['job_name'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 120],
    }),
    makeCounterProvider({
      name: 'scheduler_job_success_total',
      help: '스케줄러 성공 횟수',
      labelNames: ['job_name'],
    }),
    makeCounterProvider({
      name: 'scheduler_job_failure_total',
      help: '스케줄러 실패 횟수',
      labelNames: ['job_name'],
    }),
    makeCounterProvider({
      name: 'scheduler_job_items_processed',
      help: '처리된 항목 수',
      labelNames: ['job_name'],
    }),
    makeGaugeProvider({
      name: 'scheduler_job_last_success_timestamp',
      help: '마지막 성공 시간',
      labelNames: ['job_name'],
    }),
  ],
  exports: [PrometheusModule, HttpMetricsInterceptor],
})
export class MetricsModule {}
