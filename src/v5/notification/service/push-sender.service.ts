// src/notification/service/push-sender.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../../prisma-v5/prisma.service';
import { isNightTimeKst } from '../../common/utils/date.util';
import { admin, getMessaging } from '../fcm/firebase-admin';
import {
  AD_PREFIX,
  AD_SUFFIX,
  FCM_INVALID_TOKEN_ERROR_CODES,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPE_TO_SET_FIELD,
  PROMOTIONAL_NOTIFICATION_TYPES,
} from '../constants/notification.constants';
import { NotificationField } from '../enums/notification-field.enum';

@Injectable()
export class PushSenderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 푸시 알림 일괄 전송
   */
  async sendPushNotification(params: {
    type: NotificationType;
    title: string;
    content: string;
    targetId?: string;
    userIds: number[];
  }): Promise<{
    sent: number;
    failed: number;
    sentUserIds: number[];
    finalTitle: string;
    finalContent: string;
  }> {
    const { type, title, content, targetId, userIds } = params;
    if (userIds.length === 0)
      return {
        sent: 0,
        failed: 0,
        sentUserIds: [],
        finalTitle: title,
        finalContent: content,
      };

    const { title: finalTitle, content: finalContent } = this.promotionalFormat(
      type,
      title,
      content,
    );

    const availableUserIds = await this.getUserIdsForPush(type, userIds);
    if (availableUserIds.length === 0)
      return {
        sent: 0,
        failed: 0,
        sentUserIds: [],
        finalTitle,
        finalContent,
      };

    const tokensWithUserId = await this.prisma.fcmToken.findMany({
      where: { userId: { in: availableUserIds } },
      select: { token: true, userId: true },
    });
    if (tokensWithUserId.length === 0)
      return {
        sent: 0,
        failed: 0,
        sentUserIds: [],
        finalTitle,
        finalContent,
      };

    const tokens = tokensWithUserId.map((t) => t.token);
    const userIdsByIndex = tokensWithUserId.map((t) => t.userId);

    // Send push and get result
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
    const failedCount = tokens.length - successCount;

    return {
      sent: sentUserIdList.length,
      failed: failedCount,
      sentUserIds: sentUserIdList,
      finalTitle,
      finalContent,
    };
  }

  // ======== Private 메서드 ===========

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
  private promotionalFormat(
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
}
