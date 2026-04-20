import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { NotFoundException } from 'src/common/exceptions/business.exception';
import { NotificationResponseDto } from '../dto/response/notification-response.dto';
import { NotificationType } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { formatKstDateTime } from 'src/common/utils/date.util';

@Injectable()
export class NotificationHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 알림 목록 조회(cursor 기반)
   */
  async getNotifications(
    userId: number,
    cursor?: number,
    size: number = 20,
  ): Promise<NotificationResponseDto[]> {
    await this.userService.validateUser(userId);

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
      createdAt: formatKstDateTime(notification.createdAt),
    }));
  }

  /**
   * 읽지 않은 알림 개수
   */
  async getUnreadCount(userId: number): Promise<number> {
    await this.userService.validateUser(userId);
    return this.prisma.notificationHistories.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(userId: number, notificationId: number): Promise<void> {
    await this.userService.validateUser(userId);

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
    await this.userService.validateUser(userId);

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
    type: NotificationType,
    title: string,
    content: string,
    targetId: string | null,
    scheduleId: number | null = null,
  ): Promise<void> {
    if (userIds.length === 0) return;

    await this.prisma.notificationHistories.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        content,
        targetId,
        scheduleId,
        isRead: false,
      })),
    });
  }

  /**
   * 특정 schedule에 이미 같은 타입 알림을 보낸 적이 있는지 확인(dedup용)
   */
  async existsByScheduleAndType(
    scheduleId: number,
    type: NotificationType,
  ): Promise<boolean> {
    const count = await this.prisma.notificationHistories.count({
      where: { scheduleId, type },
    });
    return count > 0;
  }

  /**
   * 특정 유저에게 이미 보낸 RECOMMEND 알림의 concertId 목록 조회
   */
  async getSentRecommendConcertIds(userId: number): Promise<number[]> {
    const histories = await this.prisma.notificationHistories.findMany({
      where: {
        userId,
        type: NotificationType.RECOMMEND,
        targetId: { not: null },
      },
      select: { targetId: true },
    });

    return histories
      .map((h) => parseInt(h.targetId, 10))
      .filter((id) => !isNaN(id));
  }
}
