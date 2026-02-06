import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { formatKstHour, getKstDayRange } from 'src/common/utils/date.util';

@Injectable()
export class TicketingReminderScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async dailyTicketingNotifications() {
    await this.sendTicketingReminders(7, NotificationType.TICKET_7D);
    await this.sendTicketingReminders(1, NotificationType.TICKET_1D);
    await this.sendTicketingRemindersForToday();
  }

  private async sendTicketingReminders(
    daysFromToday: number,
    type: NotificationType,
  ) {
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
  }

  private async sendTicketingRemindersForToday() {
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
  }
}
