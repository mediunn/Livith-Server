import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../../prisma-v5/prisma.service';
import {
  NotificationStrategy,
  NotificationTargetParams,
  NotificationMessage,
} from './notification-strategy.interface';
import { BatchProcessor } from '../../common/utils/batch-processor.util';
import { NOTIFICATION_BATCH_SIZE } from '../constants/notification.constants';

@Injectable()
export class InterestConcertStrategy implements NotificationStrategy {
  readonly type = NotificationType.INTEREST_CONCERT;

  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTargetUserIds(_params: NotificationTargetParams): Promise<number[]> {
    const allUserIds: number[] = [];

    await BatchProcessor.processPaginated({
      batchSize: NOTIFICATION_BATCH_SIZE,
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
      title: '관심 콘서트',
      content: '관심 콘서트 알림 메시지입니다.',
    };
  }
}
