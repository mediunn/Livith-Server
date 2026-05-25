import { Module, Provider } from '@nestjs/common';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { SchedulerMetricsService } from './scheduler-metrics.service';
import { ExternalApiMetricsService } from './external-api-metrics.service';

const httpMetricProviders: Provider[] = [
  makeCounterProvider({
    name: 'http_request_total',
    help: '총 HTTP 요청 수',
    labelNames: ['method', 'route', 'status_code'],
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: '요청 처리 시간 (초)',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  }),
  makeGaugeProvider({
    name: 'http_requests_in_flight',
    help: '현재 처리 중인 요청 수',
    labelNames: ['method', 'route'],
  }),
];

const dbMetricProviders: Provider[] = [
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
];

const fcmMetricProviders: Provider[] = [
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
];

const schedulerMetricProviders: Provider[] = [
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
];

const externalApiMetricProviders: Provider[] = [
  makeCounterProvider({
    name: 'external_api_request_total',
    help: '외부 API 호출 수',
    labelNames: ['api', 'method', 'status_class'],
  }),
  makeHistogramProvider({
    name: 'external_api_request_duration_seconds',
    help: '외부 API 응답 시간 (초)',
    labelNames: ['api', 'method'],
    buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
  }),
  makeGaugeProvider({
    name: 'external_api_requests_in_flight',
    help: '진행 중인 외부 API 호출 수',
    labelNames: ['api'],
  }),
];

const recommendationMetricProviders: Provider[] = [
  makeCounterProvider({
    name: 'recommendation_cache_total',
    help: 'SWR 캐시 결과',
    labelNames: ['cache', 'result'],
  }),
  makeCounterProvider({
    name: 'recommendation_coalesced_total',
    help: 'Coalescing으로 합쳐진(dedup된) 중복 요청 수',
    labelNames: ['api'],
  }),
  makeCounterProvider({
    name: 'lastfm_rate_limit_total',
    help: 'LastFM error 29 발생 수',
  }),
  makeCounterProvider({
    name: 'lastfm_retry_total',
    help: 'Bottleneck 재시도 횟수',
  }),
  makeCounterProvider({
    name: 'youtube_quota_exceeded_total',
    help: 'YouTube quota 초과 수',
  }),
  makeCounterProvider({
    name: 'spotify_error_total',
    help: 'Spotify 토큰 실패/404',
    labelNames: ['kind'], // token_failure | not_found
  }),
];

const allMetricProviders: Provider[] = [
  ...httpMetricProviders,
  ...dbMetricProviders,
  ...fcmMetricProviders,
  ...schedulerMetricProviders,
  ...externalApiMetricProviders,
  ...recommendationMetricProviders,
];

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
    SchedulerMetricsService,
    ExternalApiMetricsService,
    ...allMetricProviders,
  ],
  exports: [
    PrometheusModule,
    HttpMetricsInterceptor,
    SchedulerMetricsService,
    ExternalApiMetricsService,
    ...allMetricProviders,
  ],
})
export class MetricsModule {}
