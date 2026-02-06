import { Injectable } from '@nestjs/common';
import { ConsentType, NotificationType, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from 'src/common/exceptions/business.exception';
import { NotificationField } from '../enums/notification-field.enum';
import { NotificationConsentResponseDto } from '../dto/response/notification-consent-response.dto';
import { NotificationSettingResponseDto } from '../dto/response/notification-set-response.dto';
import {
  AD_PREFIX,
  AD_SUFFIX,
  CONCERT_INFO_UPDATE_MESSAGES,
  FCM_INVALID_TOKEN_ERROR_CODES,
  FIELD_TO_CONSENT_TYPE,
  NOTIFICATION_ARTIST_BATCH_SIZE,
  NOTIFICATION_BATCH_SIZE,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPE_TO_SET_FIELD,
  PROMOTIONAL_FIELDS,
  PROMOTIONAL_NOTIFICATION_TYPES,
} from '../constants/notification.constants';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';
import { formatKstDateTime, isNightTimeKst } from 'src/common/utils/date.util';
import { admin, getMessaging } from '../fcm/firebase-admin';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';
import { normalizeArtistName } from 'src/common/utils/artist-name.util';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(
    userId: number,
  ): Promise<NotificationSettingResponseDto> {
    const user = await this.validateUser(userId);
    const defaults = this.buildDefaults(user.marketingConsent);

    const notificationSet = await this.prisma.notificationSet.upsert({
      where: { userId },
      update: {},
      create: { userId, ...defaults },
    });
    return new NotificationSettingResponseDto(notificationSet);
  }

  /**
   * 마케팅 동의 + 홍보성 알림 자동 활성화
   */
  async agreeMarketingConsent(
    userId: number,
  ): Promise<NotificationConsentResponseDto> {
    const user = await this.validateUser(userId);

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // 1. 마케팅 동의
      await tx.user.update({
        where: { id: userId },
        data: { marketingConsent: true },
      });

      // 2. 홍보성 알림 자동 켜기
      await this.updateNotificationSet(tx, userId, {
        benefitAlert: true,
      });

      // 3. 동의 이력 저장
      await tx.notificationConsent.createMany({
        data: PROMOTIONAL_FIELDS.map((field) => ({
          userId,
          type: FIELD_TO_CONSENT_TYPE[field],
          isAgreed: true,
          agreedAt: now,
        })),
      });
    });

    return new NotificationConsentResponseDto(now, true);
  }

  /**
   * 개별 알림 동의 처리
   */
  async createNotificationConsent(
    userId: number,
    field: NotificationField,
    isAgreed: boolean,
  ): Promise<NotificationConsentResponseDto> {
    const user = await this.validateUser(userId);

    const isPromotional = this.isPromotionalField(field);

    if (isPromotional && isAgreed && !user.marketingConsent) {
      return this.agreeMarketingConsent(userId);
    }

    const now = new Date();
    await this.updateNotificationSetAndConsent(
      userId,
      field,
      isAgreed,
      now,
      isPromotional,
    );

    return new NotificationConsentResponseDto(now, isAgreed);
  }

  // 알림 목록 조회(cursor 기반)
  async getNotifications(
    userId: number,
    cursor?: number,
    size: number = 20,
  ): Promise<NotificationResponseDto[]> {
    await this.validateUser(userId);

    const notifications = await this.prisma.notificationHistories.findMany({
      where: {
        userId,
        ...(cursor && { id: { lt: cursor } }), // cursor보다 작은 id만 조회
      },
      orderBy: { id: 'desc' },
      take: size,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      targetId: notification.targetId,
      isRead: notification.isRead,
      createdAt: this.formatDate(notification.createdAt),
    }));
  }

  // 읽지 않은 알림 개수
  async getUnreadCount(userId: number): Promise<number> {
    await this.validateUser(userId);
    return this.prisma.notificationHistories.count({
      where: { userId, isRead: false },
    });
  }

  // 알림 읽음 처리
  async markAsRead(userId: number, notificationId: number): Promise<void> {
    await this.validateUser(userId);

    const notification = await this.prisma.notificationHistories.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }

    await this.prisma.notificationHistories.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // 알림 삭제
  async deleteNotification(
    userId: number,
    notificationId: number,
  ): Promise<void> {
    await this.validateUser(userId);

    const notification = await this.prisma.notificationHistories.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }

    await this.prisma.notificationHistories.delete({
      where: { id: notificationId },
    });
  }

  /**
   * FCM 토큰 등록/업데이트(upsert)
   */
  async registerFcmToken(userId: number, token: string): Promise<void> {
    await this.validateUser(userId);

    await this.prisma.fcmToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      update: {
        // Prisma 자동 업데이트(updatedAt)
      },
      create: {
        userId,
        token,
      },
    });
  }

  /**
   * FCM 토큰 삭제
   * token이 발급되면 해당 토큰만 삭제하고, 없으면 해당 사용자의 모든 토큰을 삭제
   */
  async deleteFcmToken(userId: number, token?: string): Promise<void> {
    await this.validateUser(userId);

    if (token) {
      // 특정 토큰만 삭제
      await this.prisma.fcmToken.deleteMany({
        where: {
          userId,
          token,
        },
      });
    } else {
      // 해당 사용자의 모든 토큰 삭제
      await this.prisma.fcmToken.deleteMany({
        where: {
          userId,
        },
      });
    }
  }

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
    const { type, title, content, targetId, userIds } = params;
    if (userIds.length === 0) return { sent: 0, failed: 0 };

    const { title: finalTitle, content: finalContent } = this.PromotionalFormat(
      type,
      title,
      content,
    );

    const availableUserIds = await this.getUserIdsForPush(type, userIds);
    if (availableUserIds.length === 0) return { sent: 0, failed: 0 };

    const tokensWithUserId = await this.prisma.fcmToken.findMany({
      where: { userId: { in: availableUserIds } },
      select: { token: true, userId: true },
    });
    if (tokensWithUserId.length === 0) return { sent: 0, failed: 0 };

    const tokens = tokensWithUserId.map((t) => t.token);
    const userIdsByIndex = tokensWithUserId.map((t) => t.userId);

    const { successCount, failedTokens } = await this.sendFcmMulticast(
      tokens,
      finalTitle,
      finalContent,
      targetId,
    );

    if (failedTokens.length > 0) {
      await this.prisma.fcmToken.deleteMany({
        where: { token: { in: failedTokens } },
      });
    }

    const sentUserIds = new Set<number>();
    tokens.forEach((token, i) => {
      if (!failedTokens.includes(token)) sentUserIds.add(userIdsByIndex[i]);
    });
    const sentUserIdList = Array.from(sentUserIds);

    if (sentUserIdList.length > 0) {
      await this.prisma.notificationHistories.createMany({
        data: sentUserIdList.map((userId) => ({
          userId,
          type,
          title: finalTitle,
          content: finalContent,
          targetId: targetId ?? null,
          isRead: false,
        })),
      });
    }

    const failedCount = tokens.length - successCount;
    return { sent: sentUserIdList.length, failed: failedCount };
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

    const BATCH_SIZE = NOTIFICATION_BATCH_SIZE;
    let totalSent = 0;
    let totalFailed = 0;
    let skip = 0;

    while (true) {
      const users = await this.prisma.user.findMany({
        where: {
          interestConcertId: concertId,
          deletedAt: null,
        },
        select: { id: true },
        skip,
        take: BATCH_SIZE,
      });

      if (users.length === 0) break;

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
      skip += BATCH_SIZE;
    }

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

    const concertArtistNormalized = normalizeArtistName(concert.artist);

    // 배치 처리(1000명 단위)
    const BATCH_SIZE_ARTIST = NOTIFICATION_ARTIST_BATCH_SIZE;
    const representativeArtistIds: number[] = [];
    let skip = 0;

    while (true) {
      const candidates = await this.prisma.representativeArtist.findMany({
        select: { id: true, artistName: true },
        skip,
        take: BATCH_SIZE_ARTIST,
      });

      if (candidates.length === 0) break;

      const matchedIds = candidates
        .filter(
          (ra) =>
            normalizeArtistName(ra.artistName) === concertArtistNormalized,
        )
        .map((ra) => ra.id);

      representativeArtistIds.push(...matchedIds);
      skip += BATCH_SIZE_ARTIST;
    }

    if (representativeArtistIds.length === 0) return { sent: 0, failed: 0 };

    const userIds = await this.prisma.userArtist
      .findMany({
        where: {
          artistId: { in: representativeArtistIds },
          user: { deletedAt: null },
        },
        select: { userId: true },
      })
      .then((list) => [...new Set(list.map((ua) => ua.userId))]);

    const BATCH_SIZE = NOTIFICATION_BATCH_SIZE;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batchUserIds = userIds.slice(i, i + BATCH_SIZE);

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
    }

    return { sent: totalSent, failed: totalFailed };
  }

  // ======== Private 메서드(Helper) ===========

  /**
   * 유저 검증
   */
  private async validateUser(userId: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    return user;
  }

  /**
   * 기본값 세팅(홍보성 알림)
   */
  private buildDefaults(
    hasMarketingConsent: boolean,
  ): Record<NotificationField, boolean> {
    const defaults: Record<NotificationField, boolean> = {
      ...NOTIFICATION_DEFAULTS,
    };

    if (hasMarketingConsent) {
      PROMOTIONAL_FIELDS.forEach((field) => {
        defaults[field] = true;
      });
    }

    return defaults;
  }

  /**
   * 프로모션 알림 필드 여부 확인
   */
  private isPromotionalField(field: NotificationField): boolean {
    return PROMOTIONAL_FIELDS.includes(
      field as (typeof PROMOTIONAL_FIELDS)[number],
    );
  }

  /**
   * 알림 필드를 ConsentType으로 변환
   */
  private getConsentType(field: NotificationField): ConsentType | null {
    return FIELD_TO_CONSENT_TYPE[field] ?? null;
  }

  /**
   * 알림 설정 업데이트
   */
  private async updateNotificationSet(
    tx: any,
    userId: number,
    updates: Partial<Record<NotificationField, boolean>>,
  ): Promise<void> {
    await tx.notificationSet.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...NOTIFICATION_DEFAULTS, ...updates },
    });
  }

  /**
   * 알림 설정 및 동의 기록 업데이트(홍보성 알림인 경우 동의 기록 업데이트)
   */
  private async updateNotificationSetAndConsent(
    userId: number,
    field: NotificationField,
    isAgreed: boolean,
    now: Date,
    isPromotional: boolean,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.updateNotificationSet(tx, userId, { [field]: isAgreed });

      if (isPromotional) {
        await tx.notificationConsent.create({
          data: {
            userId,
            type: this.getConsentType(field),
            isAgreed,
            agreedAt: now,
          },
        });
      }
    });
  }

  /**
   * 푸시 발송 가능 유저 ID 목록
   */
  private async getUserIdsForPush(
    type: NotificationType,
    userIds: number[],
  ): Promise<number[]> {
    if (userIds.length === 0) return [];

    const sets = await this.prisma.notificationSet.findMany({
      where: { userId: { in: userIds } },
    });
    const setByUser = new Map(sets.map((s) => [s.userId, s]));
    const field: NotificationField = NOTIFICATION_TYPE_TO_SET_FIELD[type];
    const isNight = isNightTimeKst();

    const available: number[] = [];
    for (const userId of userIds) {
      const ns = setByUser.get(userId);
      const fieldOn = ns
        ? (ns[field] as boolean)
        : NOTIFICATION_DEFAULTS[field];
      if (!fieldOn) continue;
      if (isNight) {
        const nightOn = ns ? ns.nightAlert : false;
        if (!nightOn) continue;
      }
      available.push(userId);
    }
    return available;
  }

  /**
   * 홍보성 알림이면 title/content 가공
   */
  private PromotionalFormat(
    type: NotificationType,
    title: string,
    content: string,
  ): { title: string; content: string } {
    if (!PROMOTIONAL_NOTIFICATION_TYPES.includes(type))
      return { title, content };

    return {
      title: AD_PREFIX + title,
      content: content + AD_SUFFIX,
    };
  }

  /**
   * FCM sendEachForMulticast(500개 단위 배치), 실패 토큰 수집
   */
  private async sendFcmMulticast(
    tokens: string[],
    title: string,
    body: string,
    targetId?: string,
  ): Promise<{ successCount: number; failedTokens: string[] }> {
    const messaging = getMessaging();
    const data: Record<string, string> = targetId ? { targetId } : {};
    const batchSize = 500;
    let successCount = 0;
    const failedTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const message: admin.messaging.MulticastMessage = {
        tokens: batch,
        notification: { title, body },
        data,
      };
      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      response.responses.forEach((r, idx) => {
        if (
          !r.success &&
          r.error?.code &&
          (FCM_INVALID_TOKEN_ERROR_CODES as readonly string[]).includes(
            r.error.code,
          )
        ) {
          failedTokens.push(batch[idx]);
        }
      });
    }

    return { successCount, failedTokens };
  }

  /**
   * 날짜 형식 변환 (날짜 + 시간, KST 기준)
   */
  private formatDate(date: Date): string {
    return formatKstDateTime(date);
  }
}
