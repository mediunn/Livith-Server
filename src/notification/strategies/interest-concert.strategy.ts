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
export class InterestConcertStrategy implements NotificationStrategy {
  readonly type = NotificationType.INTEREST_CONCERT;

  constructor(private readonly prisma: PrismaService) {}

  async getTargetUserIds(params: NotificationTargetParams): Promise<number[]> {
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

  async buildMessage(
    params: NotificationTargetParams,
  ): Promise<NotificationMessage> {
    return {
      title: '관심 가는 콘서트가 있나요?',
      content:
        '관심 콘서트를 설정해두면 예매 시작과 셋리스트 업데이트 소식을 바로 알려드려요!',
    };
  }
}
