import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType, ScheduleType } from '@prisma/client';
import { formatKstHour, getKstDayRange } from 'src/common/utils/date.util';
import { SchedulerMetricsService } from '../../metrics/scheduler-metrics.service';
import { InstrumentJob } from '../../metrics/instrument-job.decorator';
import { NotificationHistoryService } from '../service/notification-history.service';

@Injectable()
export class TicketingReminderScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly historyService: NotificationHistoryService,
    readonly schedulerMetrics: SchedulerMetricsService,
  ) {}

  /**
   * 1일 전 알림: 매일 오전 10시 일괄 발송
   * PRE_TICKETING_1D / GENERAL_TICKETING_1D
   */
  @InstrumentJob('ticketing_reminder_1d')
  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async oneDayBeforeNotification(): Promise<number> {
    const pre = await this.sendOneDayBefore(
      ScheduleType.PRE_TICKETING,
      NotificationType.PRE_TICKETING_1D,
    );
    const general = await this.sendOneDayBefore(
      ScheduleType.GENERAL_TICKETING,
      NotificationType.GENERAL_TICKETING_1D,
    );
    return pre + general;
  }

  /**
   * 30분 전: 1분마다 29~31분 윈도우 스캔
   * PRE_TICKETING_30MIN / GENERAL_TICKETING_30MIN
   */
  @InstrumentJob('ticketing_reminder_30min')
  @Cron('* * * * *', { timeZone: 'Asia/Seoul' })
  async thirtyMinBeforeNotifications(): Promise<number> {
    const pre = await this.sendThirtyMinBefore(
      ScheduleType.PRE_TICKETING,
      NotificationType.PRE_TICKETING_30MIN,
    );

    const general = await this.sendThirtyMinBefore(
      ScheduleType.GENERAL_TICKETING,
      NotificationType.GENERAL_TICKETING_30MIN,
    );
    return pre + general;
  }

  /**
   * 오픈 시점: 1분마다 과거 5분 ~ 현재 윈도우 스캔
   * PRE_TICKETING_OPEN / GENERAL_TICKETING_OPEN
   */
  @InstrumentJob('ticketing_reminder_open')
  @Cron('* * * * *', { timeZone: 'Asia/Seoul' })
  async openTimeNotifications(): Promise<number> {
    const pre = await this.sendOpenTime(
      ScheduleType.PRE_TICKETING,
      NotificationType.PRE_TICKETING_OPEN,
    );
    const general = await this.sendOpenTime(
      ScheduleType.GENERAL_TICKETING,
      NotificationType.GENERAL_TICKETING_OPEN,
    );
    return pre + general;
  }

  private async sendOneDayBefore(
    scheduleType: ScheduleType,
    notificationType: NotificationType,
  ): Promise<number> {
    const { start, end } = getKstDayRange(1);
    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: scheduleType,
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    for (const schedule of schedules) {
      const timeStr = formatKstHour(schedule.scheduledAt);
      await this.notificationService.sendTicketReminderNotification(
        notificationType,
        {
          scheduleId: schedule.id,
          concertTitle: schedule.concert.title,
          timeStr,
          daysUntil: 1,
        },
        String(schedule.concert.id),
      );
    }

    return schedules.length;
  }

  private async sendThirtyMinBefore(
    scheduleType: ScheduleType,
    notificationType: NotificationType,
  ): Promise<number> {
    const now = new Date();
    const start = new Date(now.getTime() + 29 * 60 * 1000);
    const end = new Date(now.getTime() + 31 * 60 * 1000);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: scheduleType,
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    let sent = 0;
    for (const schedule of schedules) {
      const already = await this.historyService.existsByScheduleAndType(
        schedule.id,
        notificationType,
      );
      if (already) continue;

      const timeStr = formatKstHour(schedule.scheduledAt);
      await this.notificationService.sendTicketReminderNotification(
        notificationType,
        {
          scheduleId: schedule.id,
          concertTitle: schedule.concert.title,
          timeStr,
          daysUntil: 0,
        },
        String(schedule.concert.id),
      );
      sent++;
    }

    return sent;
  }

  private async sendOpenTime(
    scheduleType: ScheduleType,
    notificationType: NotificationType,
  ): Promise<number> {
    const now = new Date();
    const start = new Date(now.getTime() - 5 * 60 * 1000);
    const end = now;

    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: scheduleType,
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    let sent = 0;
    for (const schedule of schedules) {
      const already = await this.historyService.existsByScheduleAndType(
        schedule.id,
        notificationType,
      );
      if (already) continue;

      const timeStr = formatKstHour(schedule.scheduledAt);
      await this.notificationService.sendTicketReminderNotification(
        notificationType,
        {
          scheduleId: schedule.id,
          concertTitle: schedule.concert.title,
          timeStr,
          daysUntil: 0,
        },
        String(schedule.concert.id),
      );
      sent++;
    }

    return sent;
  }
}
