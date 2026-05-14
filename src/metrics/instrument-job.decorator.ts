import { SchedulerMetricsService } from './scheduler-metrics.service';

/**
 * 스케줄러 메서드에 메트릭 수집을 자동으로 적용하는 데코레이터
 */
export function InstrumentJob(jobName: string): MethodDecorator {
  return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
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

    return descriptor;
  };
}
