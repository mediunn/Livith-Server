import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationField } from '../enums/notification-field.enum';
import { NotificationConsentResponseDto } from '../dto/response/notification-consent-response.dto';
import { NotificationSettingResponseDto } from '../dto/response/notification-set-response.dto';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';
import { ArtistMatchingService } from 'src/artist/service/artist-matching.service';
import { BatchProcessor } from '../../common/utils/batch-processor.util';
import {
  CONCERT_INFO_UPDATE_MESSAGES,
  NOTIFICATION_BATCH_SIZE,
} from '../constants/notification.constants';
import { NotificationSettingsService } from './notification-settings.service';
import { FcmTokenService } from './fcm-token.service';
import { NotificationHistoryService } from './notification-history.service';
import { PushSenderService } from './push-sender.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly artistMatchingService: ArtistMatchingService,
    private readonly settingsService: NotificationSettingsService,
    private readonly fcmTokenService: FcmTokenService,
    private readonly historyService: NotificationHistoryService,
    private readonly pushSenderService: PushSenderService,
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
    userIds: number[];
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
      );
    }

    return { sent: result.sent, failed: result.failed };
  }

  /**
   * 콘서트 정보 업데이트 알림
   * 관심 콘서트로 설정한 콘서트의 정보 업데이트 시 해당 사용자에게 발송
   */
  async sendConcertInfoUpdateNotification(
    concertId: number,
    options?: {
      updateType?: ConcertInfoUpdateType;
      concertTitle?: string;
      content?: string;
    },
  ): Promise<{ sent: number; failed: number }> {
    let concertTitle: string | null = options?.concertTitle ?? null;
    if (concertTitle === null) {
      const concert = await this.prisma.concert.findUnique({
        where: { id: concertId },
        select: { title: true },
      });
      if (!concert) return { sent: 0, failed: 0 };
      concertTitle = concert.title;
    }

    const defaultContent = `${concertTitle} 정보가 업데이트되었어요!`;
    const content =
      options?.content ??
      (options?.updateType
        ? CONCERT_INFO_UPDATE_MESSAGES[options.updateType](concertTitle)
        : defaultContent);

    let totalSent = 0;
    let totalFailed = 0;

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
        const batchUserIds = users.map((u) => u.id);
        const result = await this.sendPushNotification({
          type: NotificationType.CONCERT_INFO_UPDATE,
          title: '콘서트 정보 업데이트',
          content,
          targetId: String(concertId),
          userIds: batchUserIds,
        });

        totalSent += result.sent;
        totalFailed += result.failed;
      },
    });

    return { sent: totalSent, failed: totalFailed };
  }

  /**
   * 아티스트 콘서트 오픈 알림
   * - 새 콘서트 등록 시 호출
   * - 해당 콘서트의 아티스트를 좋아하는 사용자에게 발송
   */
  async sendArtistConcertOpenNotification(
    concertId: number,
  ): Promise<{ sent: number; failed: number }> {
    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
      select: { id: true, title: true, artist: true },
    });
    if (!concert) return { sent: 0, failed: 0 };

    // Artist 도메인 로직을 서비스로 위임
    const representativeArtistIds =
      await this.artistMatchingService.findMatchingRepresentativeArtistIds(
        concert.artist,
      );

    if (representativeArtistIds.length === 0) return { sent: 0, failed: 0 };

    const userIds = await this.artistMatchingService.findUserIdsByArtistIds(
      representativeArtistIds,
    );

    let totalSent = 0;
    let totalFailed = 0;

    await BatchProcessor.processInChunks(
      userIds,
      NOTIFICATION_BATCH_SIZE,
      async (batchUserIds) => {
        const validateUsers = await this.prisma.user.findMany({
          where: { id: { in: batchUserIds }, deletedAt: null },
          select: { id: true },
        });
        const validUserIds = validateUsers.map((u) => u.id);

        if (validUserIds.length > 0) {
          const result = await this.sendPushNotification({
            type: NotificationType.ARTIST_CONCERT_OPEN,
            title: '아티스트 콘서트 오픈',
            content: `${concert.artist} 콘서트가 등록되었어요!`,
            targetId: String(concertId),
            userIds: validUserIds,
          });

          totalSent += result.sent;
          totalFailed += result.failed;
        }
      },
    );
    return { sent: totalSent, failed: totalFailed };
  }
}
