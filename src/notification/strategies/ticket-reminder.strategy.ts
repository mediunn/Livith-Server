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
  readonly type = NotificationType.PRE_TICKETING_OPEN; // 대표 타입

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
        return this.prisma.user.findMany({
          where: {
            userInterestConcerts: { some: { concertId: schedule.concertId } },
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
    const { concertTitle, notificationType } = params;
    const title = concertTitle ?? '콘서트';

    switch (notificationType) {
      case NotificationType.PRE_TICKETING_OPEN:
        return {
          title: `선호 아티스트의 선예매 오픈🔥`,
          content: `관심 콘서트로 선택하신 ${title}, 선예매 일정 소식이 도착했어요.`,
        };

      case NotificationType.GENERAL_TICKETING_OPEN:
        return {
          title: `선호 아티스트의 일반 예매 오픈🔥`,
          content: `관심 콘서트로 선택하신 ${title}, 일반 예매 일정 소식이 도착했어요.`,
        };

      case NotificationType.PRE_TICKETING_1D:
        return {
          title: `콘서트 선예매 1일전이에요!`,
          content: `관심 콘서트로 선택하신 ${title}, 내일 선예매가 시작돼요.`,
        };

      case NotificationType.PRE_TICKETING_30MIN:
        return {
          title: `콘서트 선예매 30분전이에요!`,
          content: `관심 콘서트로 선택하신 ${title}, 30분 후 선예매가 시작해요.`,
        };

      case NotificationType.GENERAL_TICKETING_1D:
        return {
          title: `콘서트 일반 예매 1일전이에요!`,
          content: `관심 콘서트로 선택하신 ${title}, 내일 일반 예매가 시작돼요.`,
        };

      case NotificationType.GENERAL_TICKETING_30MIN:
        return {
          title: `콘서트 일반 예매 30분전이에요!`,
          content: `관심 콘서트로 선택하신 ${title}, 30분 후 일반 예매가 시작해요.`,
        };

      default:
        return {
          title: `선호 아티스트의 선예매 오픈🔥`,
          content: `관심 콘서트로 선택하신 ${title}, 선예매 일정 소식이 도착했어요.`,
        };
    }
  }
}
