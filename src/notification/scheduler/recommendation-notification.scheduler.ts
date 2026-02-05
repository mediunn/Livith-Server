import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RecommendationService } from 'src/recommendation/services/recommendation.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NOTIFICATION_RECOMMEND_BATCH_SIZE } from '../constants/notification.constants';
import { BatchProcessor } from '../utils/batch-processor.util';

@Injectable()
export class RecommendationNotificationScheduler {
  private readonly logger = new Logger(
    RecommendationNotificationScheduler.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendationService: RecommendationService,
    private readonly notificationService: NotificationService,
  ) {}

  // 주 1회: 관심 콘서트가 없는 유저에게 추천 콘서트 1개 푸시
  @Cron('0 10 * * 1', { timeZone: 'Asia/Seoul' })
  async sendWeeklyRecommendNotifications() {
    this.logger.log(
      'Running weekly recommend concert notifications (Mon 10:00 KST)',
    );

    // 배치 처리
    const title = '추천 콘서트';
    const content =
      '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!';

    let totalSent = 0;
    
    await BatchProcessor.processPaginated({
      batchSize: NOTIFICATION_RECOMMEND_BATCH_SIZE,
      fetchBatch: async (skip, take) => {
        return await this.prisma.user.findMany({
          where: {
            interestConcertId: null,
            deletedAt: null,
          },
          select: {id: true},
          skip,
          take,
        });
      },
      processBatch: async (users) => {
        const batchUserIds = users.map((u) => u.id);

        for(const userId of batchUserIds){
          try{
            const concerts = await this.recommendationService.getRecommendConcerts(userId);
            const concert = concerts[0];
            if(!concert) continue;

            const result = await this.notificationService.sendPushNotification({
              type: NotificationType.RECOMMEND,
              title,
              content,
              targetId: String(concert.id),
              userIds: [userId],
            });
            totalSent += result.sent;
          }catch(err){
            this.logger.warn(
              `Recommend notification failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      },
    });

    this.logger.log(`Weekly recommend notifications sent: ${totalSent}`);
  }
}
