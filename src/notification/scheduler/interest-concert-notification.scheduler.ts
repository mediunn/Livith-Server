import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';
import { BatchProcessor } from '../../common/utils/batch-processor.util';
import { NOTIFICATION_BATCH_SIZE } from '../constants/notification.constants';

@Injectable()
export class InterestConcertNotificationScheduler {
  private readonly logger = new Logger(
    InterestConcertNotificationScheduler.name,
  );

  constructor(
    private readonly notificationService: NotificationService,
    private readonly strategyService: NotificationStrategyService,
  ) {}

  // 주 1회 화요일 오전 10시: 관심 콘서트가 없는 유저에게 설정 유도 푸시
  @Cron('0 10 * * 2', { timeZone: 'Asia/Seoul' })
  async sendWeeklyInterestConcertNotifications() {
    const strategy = this.strategyService.getStrategy(
      NotificationType.INTEREST_CONCERT,
    );

    const userIds = await strategy.getTargetUserIds({});
    if (userIds.length === 0) {
      this.logger.log('No users without interest concert found');
      return;
    }

    const message = await strategy.buildMessage({});

    let totalSent = 0;
    let totalFailed = 0;

    await BatchProcessor.processInChunks(
      userIds,
      NOTIFICATION_BATCH_SIZE,
      async (batchUserIds) => {
        const result = await this.notificationService.sendPushNotification({
          type: NotificationType.INTEREST_CONCERT,
          title: message.title,
          content: message.content,
          userIds: batchUserIds,
        });
        totalSent += result.sent;
        totalFailed += result.failed;
      },
    );

    this.logger.log(
      `Weekly interest concert notifications sent: ${totalSent}, failed: ${totalFailed}`,
    );
  }
}
