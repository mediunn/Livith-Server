import { Injectable } from '@nestjs/common';
import { ConsentType, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from 'src/common/exceptions/business.exception';
import { NotificationField } from './enums/notification-field.enum';
import { NotificationConsentResponseDto } from './dto/response/notification-consent-response.dto';
import { NotificationSettingResponseDto } from './dto/response/notification-set-response.dto';
import { FIELD_TO_CONSENT_TYPE, NOTIFICATION_DEFAULTS, PROMOTIONAL_FIELDS } from './constants/notification.constants';
import { NotificationResponseDto } from './dto/response/notification-response.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(userId: number): Promise<NotificationSettingResponseDto> {
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
  async agreeMarketingConsent(userId: number): Promise<NotificationConsentResponseDto>{
    const user = await this.validateUser(userId);

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // 1. 마케팅 동의
      await tx.user.update({
        where: {id: userId},
        data: {marketingConsent: true},
      });

      // 2. 홍보성 알림 자동 켜기
      await this.updateNotificationSet(tx, userId, {
        benefitAlert: true,
        nightAlert: true,
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
    
    if(isPromotional && isAgreed && !user.marketingConsent){
      return this.agreeMarketingConsent(userId);
    }

    const now = new Date();
    await this.updateNotificationSetAndConsent(userId, field, isAgreed, now, isPromotional);

    return new NotificationConsentResponseDto(now, isAgreed);
  }
  
  // 알림 목록 조회(cursor 기반)
  async getNotifications(
    userId: number, 
    cursor?: number,
    size: number = 20, 
  ): Promise<NotificationResponseDto[]>{
    await this.validateUser(userId);

    const notifications = await this.prisma.notificationHistories.findMany({
      where: {
      userId,
      ...(cursor && { id: { lt: cursor } }),  // cursor보다 작은 id만 조회
      },
      orderBy: { id: 'desc' },
      take: size,
    });

    return notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      deepLink: notification.deepLink,
      isRead: notification.isRead,
      createdAt: this.formatDate(notification.createdAt),
    }));
  }

  // 읽지 않은 알림 개수
  async getUnreadCount(userId: number): Promise<number>{
    await this.validateUser(userId);
    return this.prisma.notificationHistories.count({
      where: {userId, isRead: false},
    });
  }

  // 알림 읽음 처리
  async markAsRead(userId: number, notificationId: number): Promise<void>{
    await this.validateUser(userId);

    const notification = await this.prisma.notificationHistories.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }

    await this.prisma.notificationHistories.update({
      where: {id: notificationId},
      data: {isRead: true},
    });
  }

  // 알림 삭제
  async deleteNotification(userId: number, notificationId: number): Promise<void>{
    await this.validateUser(userId);

    const notification = await this.prisma.notificationHistories.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND);
    }
    
    await this.prisma.notificationHistories.delete({
      where: {id: notificationId},
    });
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
  private buildDefaults(hasMarketingConsent: boolean): Record<NotificationField, boolean> {
    const defaults: Record<NotificationField, boolean> = { ...NOTIFICATION_DEFAULTS };

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
    return PROMOTIONAL_FIELDS.includes(field as typeof PROMOTIONAL_FIELDS[number]);
  }

  /**
   * 알림 필드를 ConsentType으로 변환
   */
  private getConsentType(field: NotificationField): ConsentType | null{
    return FIELD_TO_CONSENT_TYPE[field] ?? null;
  }

  /**
   * 알림 설정 업데이트
   */
  private async updateNotificationSet(
    tx: any,
    userId: number,
    updates: Partial<Record<NotificationField, boolean>>
  ): Promise<void>{
    await tx.notificationSet.upsert({
      where: {userId},
      update: updates,
      create: {userId, ...NOTIFICATION_DEFAULTS, ...updates},
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
      await this.updateNotificationSet(tx, userId, { [field]: isAgreed});

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
   * 날짜 형식 변환
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }
}
