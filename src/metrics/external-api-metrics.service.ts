import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ExternalApi, resolveApi, statusClass } from './external-api.util';

/** request 인터셉터에서 응답/에러 단계로 넘기는 호출별 컨텍스트 */
interface MetricsConfig extends InternalAxiosRequestConfig {
  __api?: ExternalApi;
  __start?: bigint;
}

@Injectable()
export class ExternalApiMetricsService {
  constructor(
    @InjectMetric('external_api_request_total')
    private readonly counter: Counter<string>,

    @InjectMetric('external_api_request_duration_seconds')
    private readonly duration: Histogram<string>,

    @InjectMetric('external_api_requests_in_flight')
    private readonly inFlight: Gauge<string>,
  ) {}

  attach(instance: AxiosInstance): void {
    instance.interceptors.request.use((config: MetricsConfig) => {
      const api = resolveApi(this.fullUrl(config));
      if (api) {
        config.__api = api;
        config.__start = process.hrtime.bigint();
        this.inFlight.inc({ api });
      }
      return config;
    });

    instance.interceptors.response.use(
      (res) => {
        this.record(res.config as MetricsConfig, res.status);
        return res;
      },
      (err) => {
        this.record(err.config as MetricsConfig, err.response?.status);
        return Promise.reject(err);
      },
    );
  }

  private record(config: MetricsConfig | undefined, status?: number): void {
    const api = config?.__api;
    if (!api) return;

    const method = (config.method ?? 'get').toUpperCase();
    this.counter.inc({ api, method, status_class: statusClass(status) });

    if (config.__start) {
      const sec = Number(process.hrtime.bigint() - config.__start) / 1e9;
      this.duration.observe({ api, method }, sec);
    }

    this.inFlight.dec({ api });
  }

  private fullUrl(config: InternalAxiosRequestConfig): string | undefined {
    if (config.baseURL && config.url && !/^https?:\/\//.test(config.url)) {
      return (
        config.baseURL.replace(/\/$/, '') + '/' + config.url.replace(/^\//, '')
      );
    }
    return config.url ?? config.baseURL;
  }
}
