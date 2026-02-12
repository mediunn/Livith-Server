import { Injectable, Logger } from '@nestjs/common';
import { RecommendationService } from 'src/recommendation/services/recommendation.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NOTIFICATION_RECOMMEND_BATCH_SIZE } from '../constants/notification.constants';
import { BatchProcessor } from '../../common/utils/batch-processor.util';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';
import { NotificationHistoryService } from '../service/notification-history.service';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class RecommendationNotificationScheduler {
  private readonly logger = new Logger(
    RecommendationNotificationScheduler.name,
  );
  private static readonly JOB_NAME = 'recommendation_notification';

  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly notificationService: NotificationService,
    private readonly strategyService: NotificationStrategyService,
    private readonly notificationHistoryService: NotificationHistoryService,
    @InjectMetric('scheduler_job_execution_total')
    private readonly executionCounter: Counter<string>,
    @InjectMetric('scheduler_job_duration_seconds')
    private readonly durationHistogram: Histogram<string>,
    @InjectMetric('scheduler_job_success_total')
    private readonly successCounter: Counter<string>,
    @InjectMetric('scheduler_job_failure_total')
    private readonly failureCounter: Counter<string>,
    @InjectMetric('scheduler_job_items_processed')
    private readonly itemsProcessed: Counter<string>,
    @InjectMetric('scheduler_job_last_success_timestamp')
    private readonly lastSuccessTimestamp: Gauge<string>,
  ) {}

  // 주 1회: 관심 콘서트가 없는 유저에게 추천 콘서트 1개 푸시
  @Cron('0 10 * * 1', { timeZone: 'Asia/Seoul' })
  async sendWeeklyRecommendNotifications() {
    const jobName = RecommendationNotificationScheduler.JOB_NAME;
    this.executionCounter.inc({ job_name: jobName });
    const endTimer = this.durationHistogram.startTimer({ job_name: jobName });

    try {
      const strategy = this.strategyService.getStrategy(
        NotificationType.RECOMMEND,
      );

      // Strategy에서 대상 유저 조회
      const userIds = await strategy.getTargetUserIds({});
      if (userIds.length === 0) {
        this.successCounter.inc({ job_name: jobName });
        this.lastSuccessTimestamp.set({ job_name: jobName }, Date.now() / 1000);
        endTimer();
        return;
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

              const result =
                await this.notificationService.sendPushNotification({
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

      this.itemsProcessed.inc({ job_name: jobName }, totalSent);
      this.successCounter.inc({ job_name: jobName });
      this.lastSuccessTimestamp.set({ job_name: jobName }, Date.now() / 1000);
      this.logger.log(`Weekly recommend notifications sent: ${totalSent}`);
    } catch (error) {
      this.failureCounter.inc({ job_name: jobName });
      throw error;
    } finally {
      endTimer();
    }
  }
}
