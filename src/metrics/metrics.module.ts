import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics', // 매트릭 엔드포인트
      defaultMetrics: {
        enabled: true, // Node.js 기본 메트릭 활성화
      },
    }),
  ],
  exports: [PrometheusModule],
})
export class MetricsModule {}
