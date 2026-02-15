import { Injectable, Logger } from '@nestjs/common';
import { RecommendationService } from '../../recommendation/services/recommendation.service.js';
import { NotificationService } from '../service/notification.service.js';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NOTIFICATION_RECOMMEND_BATCH_SIZE } from '../constants/notification.constants.js';
import { BatchProcessor } from '../../common/utils/batch-processor.util.js';
import { NotificationStrategyService } from '../strategies/notification-strategy.service.js';
import { NotificationHistoryService } from '../service/notification-history.service.js';

@Injectable()
export class RecommendationNotificationScheduler {
  private readonly logger = new Logger(
    RecommendationNotificationScheduler.name,
  );

  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly notificationService: NotificationService,
    private readonly strategyService: NotificationStrategyService,
    private readonly notificationHistoryService: NotificationHistoryService,
    // readonly schedulerMetrics: SchedulerMetricsService, // Metrics removed
  ) {}

  // 주 1회: 관심 콘서트가 없는 유저에게 추천 콘서트 1개 푸시
  // @InstrumentJob('recommendation_notification') // Metrics removed
  @Cron('0 10 * * 1', { timeZone: 'Asia/Seoul' })
  async sendWeeklyRecommendNotifications(): Promise<number> {
    const strategy = this.strategyService.getStrategy(
      NotificationType.RECOMMEND,
    );

    // Strategy에서 대상 유저 조회
    const userIds = await strategy.getTargetUserIds({});
    if (userIds.length === 0) {
      return 0;
    }

    // Strategy에서 메시지 조회
    const message = await strategy.buildMessage({});

    let totalSent = 0;

    // 유저별로 추천 콘서트 조회 후 발송 (targetId가 유저마다 다름)
    await BatchProcessor.processInChunks(
      userIds,
      NOTIFICATION_RECOMMEND_BATCH_SIZE,
      async (batchUserIds) => {
        for (const userId of batchUserIds) {
          try {
            const concerts =
              await this.recommendationService.getRecommendConcerts(userId);
            const sentConcertIds = new Set(
              await this.notificationHistoryService.getSentRecommendConcertIds(
                userId,
              ),
            );
            const concert = concerts.find((c) => !sentConcertIds.has(c.id));
            if (!concert) continue;

            const result = await this.notificationService.sendPushNotification({
              type: NotificationType.RECOMMEND,
              title: message.title,
              content: message.content,
              targetId: String(concert.id),
              userIds: [userId],
            });
            totalSent += result.sent;
          } catch (err) {
            this.logger.warn(
              `Recommend notification failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      },
    );

    this.logger.log(`Weekly recommend notifications sent: ${totalSent}`);
    return totalSent;
  }
}
