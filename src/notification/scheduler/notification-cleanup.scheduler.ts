import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { NINETY_DAYS_MS } from 'src/common/utils/date.util';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class NotificationCleanupScheduler {
  private readonly logger = new Logger(NotificationCleanupScheduler.name);
  private static readonly JOB_NAME = 'notification_cleanup';

  constructor(
    private readonly prisma: PrismaService,
    @InjectMetric('scheduler_job_execution_total')
    private readonly executionCounter: Counter<string>,
    @InjectMetric('scheduler_job_duration_seconds')
    private readonly durationHistogram: Histogram<string>,
    @InjectMetric('scheduler_job_success_total')
    private readonly successCounter: Counter<string>,
    @InjectMetric('scheduler_job_failure_total')
    private readonly failureCounter: Counter<string>,
    @InjectMetric('scheduler_job_items_processed')
    private readonly itemsProcessed: Counter<string>,
    @InjectMetric('scheduler_job_last_success_timestamp')
    private readonly lastSuccessTimestamp: Gauge<string>,
  ) {}

  @Cron('0 3 * * *', { timeZone: 'Asia/Seoul' })
  async deleteOldNotifications() {
    const jobName = NotificationCleanupScheduler.JOB_NAME;
    this.executionCounter.inc({ job_name: jobName });
    const endTimer = this.durationHistogram.startTimer({ job_name: jobName });

    try {
      const cutoff = new Date(Date.now() - NINETY_DAYS_MS);
      const result = await this.prisma.notificationHistories.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });

      this.itemsProcessed.inc({ job_name: jobName }, result.count);
      this.successCounter.inc({ job_name: jobName });
      this.lastSuccessTimestamp.set({ job_name: jobName }, Date.now() / 1000);
      this.logger.log(
        `Deleted ${result.count} notifications older than 90 days`,
      );
    } catch (error) {
      this.failureCounter.inc({ job_name: jobName });
      throw error;
    } finally {
      endTimer();
    }
  }
}
