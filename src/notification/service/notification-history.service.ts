// src/notification/service/notification-history.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import {
  ForbiddenException,
  NotFoundException,
} from 'src/common/exceptions/business.exception';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';

@Injectable()
export class NotificationHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 목록 조회(cursor 기반)
   */
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

  /**
   * 읽지 않은 알림 개수
   */
  async getUnreadCount(userId: number): Promise<number> {
    await this.validateUser(userId);
    return this.prisma.notificationHistories.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 알림 읽음 처리
   */
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

  /**
   * 알림 삭제
   */
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
   * 알림 히스토리 저장
   */
  async createNotificationHistories(
    userIds: number[],
    type: any,
    title: string,
    content: string,
    targetId: string | null,
  ): Promise<void> {
    if (userIds.length === 0) return;

    await this.prisma.notificationHistories.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        content,
        targetId,
        isRead: false,
      })),
    });
  }

  // ======== Private 메서드 ===========

  /**
   * 유저 검증
   */
  private async validateUser(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }
  }

  /**
   * 날짜 형식 변환 (날짜 + 시간)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  }
}
