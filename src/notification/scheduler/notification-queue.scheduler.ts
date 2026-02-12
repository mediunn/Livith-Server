import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import {
  CONCERT_NOTIFICATION_EVENT_TYPE,
  CONCERT_NOTIFICATION_EVENT_TYPE_TO_UPDATE_TYPE,
} from '../constants/notification.constants';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class NotificationQueueScheduler {
  private readonly logger = new Logger(NotificationQueueScheduler.name);
  private static readonly JOB_NAME = 'notification_queue_processor';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
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

  @Cron('*/1 * * * *', { timeZone: 'Asia/Seoul' })
  async processQueue() {
    const jobName = NotificationQueueScheduler.JOB_NAME;
    this.executionCounter.inc({ job_name: jobName });
    const endTimer = this.durationHistogram.startTimer({ job_name: jobName });

    try {
      const rows = await this.prisma.concertNotificationQueue.findMany({
        where: { processed: false },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      if (rows.length === 0) {
        this.successCounter.inc({ job_name: jobName });
        this.lastSuccessTimestamp.set({ job_name: jobName }, Date.now() / 1000);
        endTimer();
        return;
      }

      for (const row of rows) {
        try {
          if (
            row.eventType ===
            CONCERT_NOTIFICATION_EVENT_TYPE.ARTIST_CONCERT_OPEN
          ) {
            await this.notificationService.sendArtistConcertOpenNotification(
              row.concertId,
            );
          } else if (row.eventType.startsWith('CONCERT_INFO_UPDATE')) {
            const updateType =
              CONCERT_NOTIFICATION_EVENT_TYPE_TO_UPDATE_TYPE[row.eventType];
            if (updateType) {
              await this.notificationService.sendConcertInfoUpdateNotification(
                row.concertId,
                updateType,
              );
            }
          }
          await this.prisma.concertNotificationQueue.update({
            where: { id: row.id },
            data: { processed: true },
          });
        } catch (err) {
          this.logger.warn(
            `NotificationQueue id=${row.id} failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      this.itemsProcessed.inc({ job_name: jobName }, rows.length);
      this.successCounter.inc({ job_name: jobName });
      this.lastSuccessTimestamp.set({ job_name: jobName }, Date.now() / 1000);
      this.logger.log(
        `Processed ${rows.length} concert notification queue item(s)`,
      );
    } catch (error) {
      this.failureCounter.inc({ job_name: jobName });
      throw error;
    } finally {
      endTimer();
    }
  }
}
