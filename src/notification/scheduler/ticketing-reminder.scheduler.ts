import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { formatKstHour, getKstDayRange } from 'src/common/utils/date.util';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class TicketingReminderScheduler {
  private static readonly JOB_NAME = 'ticketing_reminder';

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

  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async dailyTicketingNotifications() {
    const jobName = TicketingReminderScheduler.JOB_NAME;
    this.executionCounter.inc({ job_name: jobName });
    const endTimer = this.durationHistogram.startTimer({ job_name: jobName });

    try {
      const count7d = await this.sendTicketingReminders(7, NotificationType.TICKET_7D);
      const count1d = await this.sendTicketingReminders(1, NotificationType.TICKET_1D);
      const countToday = await this.sendTicketingRemindersForToday();

      this.itemsProcessed.inc({ job_name: jobName }, count7d + count1d + countToday);
      this.successCounter.inc({ job_name: jobName });
      this.lastSuccessTimestamp.set({ job_name: jobName }, Date.now() / 1000);
    } catch (error) {
      this.failureCounter.inc({ job_name: jobName });
      throw error;
    } finally {
      endTimer();
    }
  }

  private async sendTicketingReminders(
    daysFromToday: number,
    type: NotificationType,
  ): Promise<number> {
    const { start, end } = getKstDayRange(daysFromToday);
    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: 'TICKETING',
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
        type: 'TICKETING',
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
