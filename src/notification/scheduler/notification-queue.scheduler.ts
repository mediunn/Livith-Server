import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';

const EVENT_TYPE = {
  ARTIST_CONCERT_OPEN: 'ARTIST_CONCERT_OPEN',
  CONCERT_INFO_UPDATE: 'CONCERT_INFO_UPDATE',
} as const;

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
        if (row.eventType === EVENT_TYPE.ARTIST_CONCERT_OPEN) {
          await this.notificationService.sendArtistConcertOpenNotification(
            row.concertId,
          );
        } else if (row.eventType === EVENT_TYPE.CONCERT_INFO_UPDATE) {
          await this.notificationService.sendConcertInfoUpdateNotification(
            row.concertId,
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
