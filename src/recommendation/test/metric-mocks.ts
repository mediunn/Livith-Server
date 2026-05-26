import { getToken } from '@willsoto/nestjs-prometheus';

/**
 * 외부 API 메트릭(prom-client) 카운터의 테스트용 mock providers.
 * 서비스 생성자의 @InjectMetric 의존성을 충족
 */
export const externalApiMetricMocks = [
  'recommendation_cache_total',
  'recommendation_coalesced_total',
  'lastfm_rate_limit_total',
  'lastfm_retry_total',
  'youtube_quota_exceeded_total',
  'spotify_error_total',
].map((name) => ({
  provide: getToken(name),
  useValue: { inc: jest.fn() },
}));
