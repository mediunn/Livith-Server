import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { formatKstHour, getKstDayRange } from 'src/common/utils/date.util';
import { SchedulerMetricsService } from '../../metrics/scheduler-metrics.service';
import { InstrumentJob } from '../../metrics/instrument-job.decorator';

@Injectable()
export class TicketingReminderScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    readonly schedulerMetrics: SchedulerMetricsService,
  ) {}

  @InstrumentJob('ticketing_reminder')
  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async dailyTicketingNotifications(): Promise<number> {
    const count7d = await this.sendTicketingReminders(
      7,
      NotificationType.TICKET_7D,
    );
    const count1d = await this.sendTicketingReminders(
      1,
      NotificationType.TICKET_1D,
    );
    const countToday = await this.sendTicketingRemindersForToday();

    return count7d + count1d + countToday;
  }

  private async sendTicketingReminders(
    daysFromToday: number,
    type: NotificationType,
  ): Promise<number> {
    const { start, end } = getKstDayRange(daysFromToday);
    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: 'CONCERT',
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    for (const schedule of schedules) {
      await this.notificationService.sendTicketReminderNotification(
        type,
        {
          scheduleId: schedule.id,
          concertTitle: schedule.concert.title,
          daysUntil: daysFromToday,
        },
        String(schedule.concert.id),
      );
    }

    return schedules.length;
  }

  private async sendTicketingRemindersForToday(): Promise<number> {
    const { start, end } = getKstDayRange(0);
    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: 'CONCERT',
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    for (const schedule of schedules) {
      const timeStr = formatKstHour(schedule.scheduledAt);
      await this.notificationService.sendTicketReminderNotification(
        NotificationType.TICKET_TODAY,
        {
          scheduleId: schedule.id,
          concertTitle: schedule.concert.title,
          timeStr,
          daysUntil: 0,
        },
        String(schedule.concert.id),
      );
    }

    return schedules.length;
  }
}
