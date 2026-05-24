import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
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

  // 24h 이상 미처리된 큐 행은 발송하지 않고 폐기(스케줄러 장기 중단 시 적체 폭발 방지)
  private static readonly STALE_MS = 24 * 60 * 60 * 1000;

  // 이전 틱 미완료 시 동시 실행 방지(같은 배치 중복 처리 차단)
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    readonly schedulerMetrics: SchedulerMetricsService,
  ) {}

  @InstrumentJob('notification_queue_processor')
  @Cron('*/1 * * * *', { timeZone: 'Asia/Seoul' })
  async processQueue(): Promise<number> {
    if (this.isRunning) {
      this.logger.warn('NotificationQueue: 이전 실행 진행 중 → 이번 틱 skip');
      return 0;
    }
    this.isRunning = true;

    try {
      const rows = await this.prisma.concertNotificationQueue.findMany({
        where: { processed: false },
        orderBy: { id: 'asc' },
        take: 50,
      });

      if (rows.length === 0) {
        return 0;
      }

      const staleBefore = new Date(
        Date.now() - NotificationQueueScheduler.STALE_MS,
      );
      let handled = 0;
      let discarded = 0;

      for (const row of rows) {
        // 오래된 백로그는 발송 없이 폐기
        if (row.createdAt && new Date(row.createdAt) < staleBefore) {
          await this.markProcessed(row.id);
          discarded++;
          continue;
        }

        try {
          await this.dispatch(row);
          handled++;
        } catch (err) {
          this.logger.warn(
            `NotificationQueue id=${row.id} failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }

        // 성공/실패/미인식 무관하게 처리 완료 표시 → head-of-line 블로킹 방지
        // (at-most-once: 이 알림 타입은 유실 허용, 중복 freeze보다 안전)
        await this.markProcessed(row.id);
      }

      this.logger.log(
        `NotificationQueue: handled=${handled} discarded(stale)=${discarded} total=${rows.length}`,
      );
      return rows.length;
    } finally {
      this.isRunning = false;
    }
  }

  private async dispatch(row: {
    id: number;
    concertId: number;
    eventType: string;
  }): Promise<void> {
    if (row.eventType === CONCERT_NOTIFICATION_EVENT_TYPE.ARTIST_CONCERT_OPEN) {
      await this.notificationService.sendArtistConcertOpenNotification(
        row.concertId,
      );
      return;
    }

    if (row.eventType.startsWith('CONCERT_INFO_UPDATE')) {
      const updateType =
        CONCERT_NOTIFICATION_EVENT_TYPE_TO_UPDATE_TYPE[row.eventType];
      if (updateType) {
        await this.notificationService.sendConcertInfoUpdateNotification(
          row.concertId,
          updateType,
        );
        return;
      }
    }

    // 매칭/매핑 안 되는 eventType — 조용히 폐기하지 말고 가시화
    this.logger.warn(
      `NotificationQueue id=${row.id} unhandled eventType=${row.eventType} → 폐기`,
    );
  }

  private async markProcessed(id: number): Promise<void> {
    await this.prisma.concertNotificationQueue.update({
      where: { id },
      data: { processed: true },
    });
  }
}
