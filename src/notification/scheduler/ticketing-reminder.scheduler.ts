import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { formatKstHour, getKstDayRange } from 'src/common/utils/date.util';
import { NOTIFICATION_BATCH_SIZE } from '../constants/notification.constants';

@Injectable()
export class TicketingReminderScheduler {
  private readonly logger = new Logger(TicketingReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async dailyTicketingNotifications() {
    this.logger.log('run daily ticketing notifications (10:00 KST)');

    await this.sendTicketingReminders(
      7,
      NotificationType.TICKET_7D,
      (concertTitle) => `${concertTitle} 예매가 7일 뒤에 시작해요!`,
    );
    await this.sendTicketingReminders(
      1,
      NotificationType.TICKET_1D,
      (concertTitle) => `${concertTitle} 예매가 내일 시작해요!`,
    );
    await this.sendTicketingRemindersForToday();
  }

  private async sendTicketingReminders(
    daysfromToday: number,
    type: NotificationType,
    contentFn: (concertTitle: string) => string,
  ) {
    const { start, end } = getKstDayRange(daysfromToday);
    const schedules = await this.prisma.schedule.findMany({
      where: {
        type: 'TICKETING',
        scheduledAt: { gte: start, lte: end },
      },
      include: { concert: { select: { id: true, title: true } } },
    });

    for (const schedule of schedules) {
      const BATCH_SIZE = NOTIFICATION_BATCH_SIZE;
      let skip = 0;

      while (true) {
        const users = await this.prisma.user.findMany({
          where: {
            interestConcertId: schedule.concertId,
            deletedAt: null,
          },
          select: { id: true },
          skip,
          take: BATCH_SIZE,
        });

        if (users.length === 0) break;

        const batchUserIds = users.map((u) => u.id);
        await this.notificationService.sendPushNotification({
          type,
          title: '예매 일정',
          content: contentFn(schedule.concert.title),
          targetId: String(schedule.concert.id),
          userIds: batchUserIds,
        });

        skip += BATCH_SIZE;
      }
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
      const BATCH_SIZE = NOTIFICATION_BATCH_SIZE;
      let skip = 0;

      while (true) {
        const users = await this.prisma.user.findMany({
          where: {
            interestConcertId: schedule.concertId,
            deletedAt: null,
          },
          select: { id: true },
          skip,
          take: BATCH_SIZE,
        });

        if (users.length === 0) break;

        const batchUserIds = users.map((u) => u.id);
        const timeStr = formatKstHour(schedule.scheduledAt);
        await this.notificationService.sendPushNotification({
          type: NotificationType.TICKET_TODAY,
          title: '예매 일정',
          content: `${schedule.concert.title} 예매가 오늘 ${timeStr}에 시작해요!`,
          targetId: String(schedule.concert.id),
          userIds: batchUserIds,
        });

        skip += BATCH_SIZE;
      }
    }
  }
}
