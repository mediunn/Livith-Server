import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import {
  NotificationStrategy,
  NotificationMessage,
  NotificationTargetParams,
} from './notification-strategy.interface';
import { BatchProcessor } from '../../common/utils/batch-processor.util';
import { NOTIFICATION_RECOMMEND_BATCH_SIZE } from '../constants/notification.constants';
import { PrismaService } from '../../../../prisma-v5/prisma.service';

@Injectable()
export class RecommendationStrategy implements NotificationStrategy {
  readonly type = NotificationType.RECOMMEND;

  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTargetUserIds(_params: NotificationTargetParams): Promise<number[]> {
    const allUserIds: number[] = [];

    await BatchProcessor.processPaginated({
      batchSize: NOTIFICATION_RECOMMEND_BATCH_SIZE,
      fetchBatch: async (skip, take) => {
        return await this.prisma.user.findMany({
          where: {
            interestConcertId: null,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async buildMessage(
    _params: NotificationTargetParams,
  ): Promise<NotificationMessage> {
    return {
      title: '추천 콘서트',
      content:
        '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!',
    };
  }
}
