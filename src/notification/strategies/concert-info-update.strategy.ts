import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import {
  NotificationStrategy,
  NotificationTargetParams,
  NotificationMessage,
} from './notification-strategy.interface';
import {
  CONCERT_INFO_UPDATE_MESSAGES,
  NOTIFICATION_BATCH_SIZE,
} from '../constants/notification.constants';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';
import { BatchProcessor } from 'src/common/utils/batch-processor.util';

@Injectable()
export class ConcertInfoUpdateStrategy implements NotificationStrategy {
  readonly type = NotificationType.CONCERT_INFO_UPDATE;

  constructor(private readonly prisma: PrismaService) {}

  async getTargetUserIds(params: NotificationTargetParams): Promise<number[]> {
    const { concertId } = params;
    if (!concertId) return [];

    const allUserIds: number[] = [];

    await BatchProcessor.processPaginated({
      batchSize: NOTIFICATION_BATCH_SIZE,
      fetchBatch: async (skip, take) => {
        return await this.prisma.user.findMany({
          where: {
            interestConcertId: concertId,
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
    const { concertId, updateType, concertTitle, content } = params;

    const title = '콘서트 정보 업데이트';
    let finalContent = content as string;

    if (!finalContent) {
      const fetchedTitle =
        concertTitle ||
        (await this.prisma.concert
          .findUnique({
            where: { id: concertId },
            select: { title: true },
          })
          .then((c) => c?.title));

      if (fetchedTitle) {
        if (updateType) {
          finalContent =
            CONCERT_INFO_UPDATE_MESSAGES[updateType as ConcertInfoUpdateType](
              fetchedTitle,
            );
        } else {
          finalContent = `${fetchedTitle} 정보가 업데이트되었어요!`;
        }
      } else {
        finalContent = '콘서트 정보가 업데이트되었어요!';
      }
    }

    return { title, content: finalContent };
  }
}
