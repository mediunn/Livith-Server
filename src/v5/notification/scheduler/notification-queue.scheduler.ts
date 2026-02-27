import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma-v5/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import {
  CONCERT_NOTIFICATION_EVENT_TYPE,
  CONCERT_NOTIFICATION_EVENT_TYPE_TO_UPDATE_TYPE,
} from '../constants/notification.constants';
import { SchedulerMetricsService } from '../../metrics/scheduler-metrics.service';
import { InstrumentJob } from '../../metrics/instrument-job.decorator';

@Injectable()
export class NotificationQueueScheduler {
  private readonly logger = new Logger(NotificationQueueScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    readonly schedulerMetrics: SchedulerMetricsService,
  ) {}

  @InstrumentJob('notification_queue_processor')
  @Cron('*/1 * * * *', { timeZone: 'Asia/Seoul' })
  async processQueue(): Promise<number> {
    const rows = await this.prisma.concertNotificationQueue.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (rows.length === 0) {
      return 0;
    }

    for (const row of rows) {
      try {
        if (
          row.eventType === CONCERT_NOTIFICATION_EVENT_TYPE.ARTIST_CONCERT_OPEN
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

    this.logger.log(
      `Processed ${rows.length} concert notification queue item(s)`,
    );
    return rows.length;
  }
}
