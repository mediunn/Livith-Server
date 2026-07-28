import { SchedulerMetricsService } from './scheduler-metrics.service';

/**
 * 스케줄러 메서드에 메트릭 수집을 자동으로 적용하는 데코레이터
 */
export function InstrumentJob(jobName: string): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    const wrapped = async function (
      this: { schedulerMetrics: SchedulerMetricsService },
      ...args: unknown[]
    ) {
      const metrics = this.schedulerMetrics;
      const labels = { job_name: jobName };

      metrics.executionCounter.inc(labels);
      const endTimer = metrics.durationHistogram.startTimer(labels);

      try {
        const result = await originalMethod.apply(this, args);

        const processedCount = typeof result === 'number' ? result : 0;
        if (processedCount > 0) {
          metrics.itemsProcessed.inc(labels, processedCount);
        }

        metrics.successCounter.inc(labels);
        metrics.lastSuccessTimestamp.set(labels, Date.now() / 1000);

        return result;
      } catch (error) {
        metrics.failureCounter.inc(labels);
        throw error;
      } finally {
        endTimer();
      }
    };

    // @Cron/@Interval 등이 원본 함수에 붙인 Reflect 메타데이터를 래퍼로 이관.
    // 안 하면 @nestjs/schedule explorer 가 instance[key](=래퍼)에서 cron
    // 메타데이터를 못 찾아 job 자체가 등록되지 않는다.
    for (const key of Reflect.getMetadataKeys(originalMethod)) {
      Reflect.defineMetadata(
        key,
        Reflect.getMetadata(key, originalMethod),
        wrapped,
      );
    }

    descriptor.value = wrapped;
    return descriptor;
  };
}
