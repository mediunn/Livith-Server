import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma-v5/prisma.service';
import { Cron } from '@nestjs/schedule';
import { NINETY_DAYS_MS } from '../../common/utils/date.util';
import { SchedulerMetricsService } from '../../metrics/scheduler-metrics.service';
import { InstrumentJob } from '../../metrics/instrument-job.decorator';

@Injectable()
export class NotificationCleanupScheduler {
  private readonly logger = new Logger(NotificationCleanupScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    readonly schedulerMetrics: SchedulerMetricsService,
  ) {}

  @InstrumentJob('notification_cleanup')
  @Cron('0 3 * * *', { timeZone: 'Asia/Seoul' })
  async deleteOldNotifications(): Promise<number> {
    const cutoff = new Date(Date.now() - NINETY_DAYS_MS);
    const result = await this.prisma.notificationHistories.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    this.logger.log(`Deleted ${result.count} notifications older than 90 days`);
    return result.count;
  }
}
