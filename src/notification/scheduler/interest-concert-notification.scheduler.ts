import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';

@Injectable()
export class InterestConcertNotificationScheduler {
  private readonly logger = new Logger(
    InterestConcertNotificationScheduler.name,
  );

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  // 주 1회 화요일 오전 10시: 관심 콘서트가 없는 유저에게 설정 푸시
  @Cron('0 10 * * 2', { timeZone: 'Asia/Seoul' })
  async sendInterestConcertNotifications() {
    const {sent, failed} = await this.notificationService.sendNotificationByStrategy(
      NotificationType.INTEREST_CONCERT,
      {},
    );

    if(sent > 0 || failed > 0){
      this.logger.log(
        `interest concert notifications sent: ${sent}, failed: ${failed}`,
      );
    }else{
      this.logger.log('No users without interest concert found');
    }
  }
}
