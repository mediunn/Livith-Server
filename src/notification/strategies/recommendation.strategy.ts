import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  NotificationStrategy,
  NotificationTargetParams,
  NotificationMessage,
} from './notification-strategy.interface';
import { BatchProcessor } from 'src/common/utils/batch-processor.util';
import { NOTIFICATION_RECOMMEND_BATCH_SIZE } from '../constants/notification.constants';

@Injectable()
export class RecommendationStrategy implements NotificationStrategy {
  readonly type = NotificationType.RECOMMEND;

  constructor(private readonly prisma: PrismaService) {}

  async getTargetUserIds(params: NotificationTargetParams): Promise<number[]> {
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

  async buildMessage(
    params: NotificationTargetParams,
  ): Promise<NotificationMessage> {
    return {
      title: '취향 기반 콘서트 정보가 업데이트됐어요 🎵',
      content: '선택하신 취향과 관련된 콘서트를 확인해보세요.',
    };
  }
}
