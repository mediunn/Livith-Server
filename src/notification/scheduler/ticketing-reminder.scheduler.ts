import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType, ScheduleType } from '@prisma/client';
import {
  formatKstHour,
  getKstDayRange,
  kstLiteralToUtc,
  utcToKstLiteral,
} from 'src/common/utils/date.util';
import { SchedulerMetricsService } from '../../metrics/scheduler-metrics.service';
import { InstrumentJob } from '../../metrics/instrument-job.decorator';
import { NotificationDispatchService } from '../service/notification-dispatch.service';

@Injectable()
export class TicketingReminderScheduler {
  private readonly logger = new Logger(TicketingReminderScheduler.name);

  private running1d = false;
  private running30min = false;
  private runningOpen = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly dispatchService: NotificationDispatchService,
    readonly schedulerMetrics: SchedulerMetricsService,
  ) {}

  /**
   * 1일 전 알림: 매일 오전 10시 일괄 발송
   * PRE_TICKETING_1D / GENERAL_TICKETING_1D
   */
  @InstrumentJob('ticketing_reminder_1d')
  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async oneDayBeforeNotification(): Promise<number> {
    if (this.running1d) return 0;
    this.running1d = true;
    try {
      const pre = await this.sendOneDayBefore(
        ScheduleType.PRE_TICKETING,
        NotificationType.PRE_TICKETING_1D,
      );
      const general = await this.sendOneDayBefore(
        ScheduleType.GENERAL_TICKETING,
        NotificationType.GENERAL_TICKETING_1D,
      );
      return pre + general;
    } finally {
      this.running1d = false;
    }
  }

  /**
   * 30분 전: 1분마다 29~31분 윈도우 스캔
   * PRE_TICKETING_30MIN / GENERAL_TICKETING_30MIN
   */
  @InstrumentJob('ticketing_reminder_30min')
  @Cron('* * * * *', { timeZone: 'Asia/Seoul' })
  async thirtyMinBeforeNotifications(): Promise<number> {
    if (this.running30min) return 0;
    this.running30min = true;
    try {
      const pre = await this.sendThirtyMinBefore(
        ScheduleType.PRE_TICKETING,
        NotificationType.PRE_TICKETING_30MIN,
      );

      const general = await this.sendThirtyMinBefore(
        ScheduleType.GENERAL_TICKETING,
        NotificationType.GENERAL_TICKETING_30MIN,
      );
      return pre + general;
    } finally {
      this.running30min = false;
    }
  }

  /**
   * 오픈 10분 전: 1분마다 9~11분 윈도우 스캔
   * PRE_TICKETING_OPEN / GENERAL_TICKETING_OPEN
   */
  @InstrumentJob('ticketing_reminder_open')
  @Cron('* * * * *', { timeZone: 'Asia/Seoul' })
  async openTimeNotifications(): Promise<number> {
    if (this.runningOpen) return 0;
    this.runningOpen = true;
    try {
      const pre = await this.sendOpenTime(
        ScheduleType.PRE_TICKETING,
        NotificationType.PRE_TICKETING_OPEN,
      );
      const general = await this.sendOpenTime(
        ScheduleType.GENERAL_TICKETING,
        NotificationType.GENERAL_TICKETING_OPEN,
      );
      return pre + general;
    } finally {
      this.runningOpen = false;
    }
  }

  /**
   * 단건 발송: claim 성공 시에만 발송하고 결과로 ledger 마감
   */
  private async dispatch(
    schedule: { id: number; concert: { id: number; title: string | null } },
    notificationType: NotificationType,
    daysUntil: number,
    scheduledAt: Date,
  ): Promise<boolean> {
    const claimed = await this.dispatchService.tryClaim(
      schedule.id,
      notificationType,
    );

    if (!claimed) return false;

    try {
      const timeStr = formatKstHour(scheduledAt);
      await this.notificationService.sendNotificationByStrategy(
        notificationType,
        {
          scheduleId: schedule.id,
          concertTitle: schedule.concert.title,
          timeStr,
          daysUntil,
        },
        String(schedule.concert.id),
      );
      await this.dispatchService.markSent(schedule.id, notificationType);
      return true;
    } catch (err) {
      await this.dispatchService.markFailed(schedule.id, notificationType);
      this.logger.error(
        `티켓팅 알림 발송 실패 scheduleId=${schedule.id} type=${notificationType}`,
        err instanceof Error ? err.stack : String(err),
      );
      return false;
    }
  }

  private async sendOneDayBefore(
    scheduleType: ScheduleType,
    notificationType: NotificationType,
  ): Promise<number> {
    const { start, end } = getKstDayRange(1);
    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: scheduleType,
        scheduledAt: {
          gte: utcToKstLiteral(start),
          lte: utcToKstLiteral(end),
        },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    let sent = 0;
    for (const schedule of schedules) {
      const ok = await this.dispatch(
        schedule,
        notificationType,
        1,
        kstLiteralToUtc(schedule.scheduledAt),
      );
      if (ok) sent++;
    }

    return sent;
  }

  private async sendThirtyMinBefore(
    scheduleType: ScheduleType,
    notificationType: NotificationType,
  ): Promise<number> {
    const now = new Date();
    const start = utcToKstLiteral(new Date(now.getTime() + 29 * 60 * 1000));
    const end = utcToKstLiteral(new Date(now.getTime() + 31 * 60 * 1000));

    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: scheduleType,
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    let sent = 0;
    for (const schedule of schedules) {
      const ok = await this.dispatch(
        schedule,
        notificationType,
        0,
        kstLiteralToUtc(schedule.scheduledAt),
      );
      if (ok) sent++;
    }

    return sent;
  }

  private async sendOpenTime(
    scheduleType: ScheduleType,
    notificationType: NotificationType,
  ): Promise<number> {
    const now = new Date();
    const start = utcToKstLiteral(new Date(now.getTime() + 9 * 60 * 1000));
    const end = utcToKstLiteral(new Date(now.getTime() + 11 * 60 * 1000));

    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: scheduleType,
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    let sent = 0;
    for (const schedule of schedules) {
      const ok = await this.dispatch(
        schedule,
        notificationType,
        0,
        kstLiteralToUtc(schedule.scheduledAt),
      );
      if (ok) sent++;
    }

    return sent;
  }
}
