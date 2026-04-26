import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationField } from '../enums/notification-field.enum';
import { NotificationConsentResponseDto } from '../dto/response/notification-consent-response.dto';
import { NotificationSettingResponseDto } from '../dto/response/notification-set-response.dto';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';
import { UPDATE_TYPE_TO_NOTIFICATION_TYPE } from '../constants/notification.constants';
import { BatchProcessor } from '../../common/utils/batch-processor.util';
import { NOTIFICATION_BATCH_SIZE } from '../constants/notification.constants';
import { NotificationSettingsService } from './notification-settings.service';
import { FcmTokenService } from './fcm-token.service';
import { NotificationHistoryService } from './notification-history.service';
import { PushSenderService } from './push-sender.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';
import { NotificationTargetParams } from '../strategies/notification-strategy.interface';

@Injectable()
export class NotificationService {
  constructor(
    private readonly settingsService: NotificationSettingsService,
    private readonly fcmTokenService: FcmTokenService,
    private readonly historyService: NotificationHistoryService,
    private readonly pushSenderService: PushSenderService,
    private readonly strategyService: NotificationStrategyService,
  ) {}

  // 알림 설정 관련
  async getNotificationSettings(
    userId: number,
  ): Promise<NotificationSettingResponseDto> {
    return this.settingsService.getNotificationSettings(userId);
  }

  async agreeMarketingConsent(
    userId: number,
  ): Promise<NotificationConsentResponseDto> {
    return this.settingsService.agreeMarketingConsent(userId);
  }

  async createNotificationConsent(
    userId: number,
    field: NotificationField,
    isAgreed: boolean,
  ): Promise<NotificationConsentResponseDto> {
    return this.settingsService.createNotificationConsent(
      userId,
      field,
      isAgreed,
    );
  }

  // FCM 토큰 관련
  async registerFcmToken(userId: number, token: string): Promise<void> {
    return this.fcmTokenService.registerFcmToken(userId, token);
  }

  async deleteFcmToken(userId: number, token?: string): Promise<void> {
    return this.fcmTokenService.deleteFcmToken(userId, token);
  }

  async getAllUserIdsWithFcmToken(): Promise<number[]> {
    return this.fcmTokenService.getAllUserIdsWithFcmToken();
  }

  // 알림 히스토리 관련
  async getNotifications(
    userId: number,
    cursor?: number,
    size: number = 20,
  ): Promise<NotificationResponseDto[]> {
    return this.historyService.getNotifications(userId, cursor, size);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.historyService.getUnreadCount(userId);
  }

  async markAsRead(userId: number, notificationId: number): Promise<void> {
    return this.historyService.markAsRead(userId, notificationId);
  }

  async deleteNotification(
    userId: number,
    notificationId: number,
  ): Promise<void> {
    return this.historyService.deleteNotification(userId, notificationId);
  }

  //푸시 전송 (비즈니스 로직 + 히스토리 저장)

  /**
   * 푸시 알림 일괄 전송
   */
  async sendPushNotification(params: {
    type: NotificationType;
    title: string;
    content: string;
    targetId?: string;
    scheduleId?: number;
    userIds: number[];
    skipUserFilter?: boolean;
  }): Promise<{ sent: number; failed: number }> {
    const result = await this.pushSenderService.sendPushNotification(params);

    // 히스토리 저장
    if (result.sentUserIds && result.sentUserIds.length > 0) {
      await this.historyService.createNotificationHistories(
        result.sentUserIds,
        params.type,
        result.finalTitle,
        result.finalContent,
        params.targetId ?? null,
        params.scheduleId ?? null,
      );
    }

    return { sent: result.sent, failed: result.failed };
  }

  /**
   * Strategy 패턴을 사용한 통합 알림 전송
   * - Strategy가 대상 유저와 메시지를 결정
   */
  async sendNotificationByStrategy(
    type: NotificationType,
    params: NotificationTargetParams,
    targetId?: string,
  ): Promise<{ sent: number; failed: number }> {
    // 1. Strategy 조회
    const strategy = this.strategyService.getStrategy(type);

    // 2. 대상 유저 조회
    const userIds = await strategy.getTargetUserIds(params);
    if (userIds.length == 0) {
      return { sent: 0, failed: 0 };
    }

    // 3. 메시지 생성
    const message = await strategy.buildMessage({
      ...params,
      notificationType: type,
    });

    // 4. 배치 처리로 푸시 전송
    let totalSent = 0;
    let totalFailed = 0;

    await BatchProcessor.processInChunks(
      userIds,
      NOTIFICATION_BATCH_SIZE,
      async (batchUserIds) => {
        const result = await this.sendPushNotification({
          type,
          title: message.title,
          content: message.content,
          targetId,
          scheduleId: params.scheduleId,
          userIds: batchUserIds,
        });
        totalSent += result.sent;
        totalFailed += result.failed;
      },
    );

    return { sent: totalSent, failed: totalFailed };
  }

  /**
   * 콘서트 정보 업데이트 알림
   * 관심 콘서트로 설정한 콘서트의 정보 업데이트 시 해당 사용자에게 발송
   */
  async sendConcertInfoUpdateNotification(
    concertId: number,
    updateType: ConcertInfoUpdateType,
    options?: {
      concertTitle?: string;
      content?: string;
    },
  ): Promise<{ sent: number; failed: number }> {
    const notificationType = UPDATE_TYPE_TO_NOTIFICATION_TYPE[updateType];

    return this.sendNotificationByStrategy(
      notificationType,
      {
        concertId,
        updateType,
        concertTitle: options?.concertTitle,
        content: options?.content,
      },
      String(concertId),
    );
  }

  /**
   * 아티스트 콘서트 오픈 알림
   * - 새 콘서트 등록 시 호출
   * - 해당 콘서트의 아티스트를 좋아하는 사용자에게 발송
   */
  async sendArtistConcertOpenNotification(
    concertId: number,
  ): Promise<{ sent: number; failed: number }> {
    return this.sendNotificationByStrategy(
      NotificationType.ARTIST_CONCERT_OPEN,
      { concertId },
      String(concertId),
    );
  }
}
