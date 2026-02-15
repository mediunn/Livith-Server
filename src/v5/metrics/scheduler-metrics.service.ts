import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';

@Injectable()
export class SchedulerMetricsService {
  constructor(
    @InjectMetric('scheduler_job_execution_total')
    readonly executionCounter: Counter<string>,

    @InjectMetric('scheduler_job_duration_seconds')
    readonly durationHistogram: Histogram<string>,

    @InjectMetric('scheduler_job_success_total')
    readonly successCounter: Counter<string>,

    @InjectMetric('scheduler_job_failure_total')
    readonly failureCounter: Counter<string>,

    @InjectMetric('scheduler_job_items_processed')
    readonly itemsProcessed: Counter<string>,

    @InjectMetric('scheduler_job_last_success_timestamp')
    readonly lastSuccessTimestamp: Gauge<string>,
  ) {}
}
