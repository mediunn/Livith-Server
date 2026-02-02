import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import {
  CONCERT_NOTIFICATION_EVENT_TYPE,
  CONCERT_NOTIFICATION_EVENT_TYPE_TO_UPDATE_TYPE,
} from '../constants/notification.constants';

@Injectable()
export class NotificationQueueScheduler {
  private readonly logger = new Logger(NotificationQueueScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('*/1 * * * *', { timeZone: 'Asia/Seoul' })
  async processQueue() {
    const rows = await this.prisma.concertNotificationQueue.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    if (rows.length === 0) return;

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
          await this.notificationService.sendConcertInfoUpdateNotification(
            row.concertId,
            updateType ? { updateType } : undefined,
          );
        }
      } catch (err) {
        this.logger.warn(
          `NotificationQueue id=${row.id} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      await this.prisma.concertNotificationQueue.update({
        where: { id: row.id },
        data: { processed: true },
      });
    }
    this.logger.log(
      `Processed ${rows.length} concert notification queue item(s)`,
    );
  }
}
