import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RecommendationService } from 'src/recommendation/services/recommendation.service';
import { NotificationService } from '../service/notification.service';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';

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

    const users = await this.prisma.user.findMany({
      where: {
        interestConcertId: null,
        deletedAt: null,
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return;

    const title = '추천 콘서트';
    const content =
      '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!';

    let sent = 0;
    for (const userId of userIds) {
      try {
        const concerts =
          await this.recommendationService.getRecommendConcerts(userId);
        const concert = concerts[0];
        if (!concert) continue;

        const result = await this.notificationService.sendPushNotification({
          type: NotificationType.RECOMMEND,
          title,
          content,
          targetId: String(concert.id),
          userIds: [userId],
        });
        sent += result.sent;
      } catch (err) {
        this.logger.warn(
          `Recommend notification failed for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    this.logger.log(`Weekly recommend notifications sent: ${sent}`);
  }
}
