import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  NotificationStrategy,
  NotificationTargetParams,
  NotificationMessage,
} from './notification-strategy.interface';
import { BatchProcessor } from 'src/common/utils/batch-processor.util';
import { NOTIFICATION_BATCH_SIZE } from '../constants/notification.constants';
import { formatHourAmPm } from 'src/common/utils/date.util';

@Injectable()
export class TicketReminderStrategy implements NotificationStrategy {
  readonly type = NotificationType.TICKET_7D; // 대표 타입

  constructor(private readonly prisma: PrismaService) {}

  async getTargetUserIds(params: NotificationTargetParams): Promise<number[]> {
    const { scheduleId } = params;
    if (!scheduleId) return [];

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { concertId: true },
    });

    if (!schedule) return [];

    const allUserIds: number[] = [];

    await BatchProcessor.processPaginated({
      batchSize: NOTIFICATION_BATCH_SIZE,
      fetchBatch: async (skip, take) => {
        return await this.prisma.user.findMany({
          where: {
            interestConcertId: schedule.concertId,
            deletedAt: null,
          },
          select: { id: true },
          skip,
          take,
        });
      },
      processBatch: async (users) => {
        allUserIds.push(...users.map((u) => u.id));
      },
    });

    return allUserIds;
  }

  async buildMessage(
    params: NotificationTargetParams,
  ): Promise<NotificationMessage> {
    let { concertTitle, timeStr, daysUntil } = params;

    if (!concertTitle && params.concertId) {
      const concert = await this.prisma.concert.findUnique({
        where: { id: params.concertId },
        select: { title: true },
      });
      concertTitle = concert?.title ?? '콘서트';
    }

    if (daysUntil === undefined && params.notificationType) {
      if (params.notificationType === NotificationType.TICKET_TODAY) {
        daysUntil = 0;
        timeStr = timeStr ?? '20시';
      } else if (params.notificationType === NotificationType.TICKET_1D) {
        daysUntil = 1;
      } else {
        daysUntil = 7;
      }
    } else {
      daysUntil = daysUntil ?? 7;
    }

    if (daysUntil === 0) {
      return {
        title: `오늘 ${formatHourAmPm(timeStr ?? '')} 예매가 시작이에요`,
        content: `관심 콘서트 '${concertTitle}', 오늘 ${formatHourAmPm(timeStr ?? '')} 예매가 시작돼요.`,
      };
    }

    return {
      title: `띵동! ${daysUntil}일 뒤 예매가 시작돼요`,
      content: `관심 콘서트 '${concertTitle}', 예매 일정이 다가왔어요.`,
    };
  }
}
