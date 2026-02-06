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

    // concertId만 전달된 경우 조회 (테스트용)
    if (!concertTitle && params.concertId) {
      const concert = await this.prisma.concert.findUnique({
        where: { id: params.concertId },
        select: { title: true },
      });
      concertTitle = concert?.title ?? '콘서트';
      daysUntil = daysUntil ?? 7;
    }

    let content = '';
    if (daysUntil === 7) {
      content = `${concertTitle} 예매가 7일 뒤에 시작해요!`;
    } else if (daysUntil === 1) {
      content = `${concertTitle} 예매가 내일 시작해요!`;
    } else if (daysUntil === 0) {
      content = `${concertTitle} 예매가 오늘 ${timeStr}에 시작해요!`;
    }

    return {
      title: '예매 일정',
      content,
    };
  }
}
