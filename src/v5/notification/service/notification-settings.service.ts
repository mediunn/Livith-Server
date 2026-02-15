// src/notification/service/notification-settings.service.ts
import { Injectable } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import { PrismaService } from '../../../../prisma-v5/prisma.service';
import { NotificationField } from '../enums/notification-field.enum';
import { NotificationConsentResponseDto } from '../dto/response/notification-consent-response.dto';
import { NotificationSettingResponseDto } from '../dto/response/notification-set-response.dto';
import {
  FIELD_TO_CONSENT_TYPE,
  NOTIFICATION_DEFAULTS,
  PROMOTIONAL_FIELDS,
} from '../constants/notification.constants';
import { UserService } from '../../user/user.service';

@Injectable()
export class NotificationSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * 알림 설정 조회
   */
  async getNotificationSettings(
    userId: number,
  ): Promise<NotificationSettingResponseDto> {
    const user = await this.userService.validateUser(userId);
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
    await this.userService.validateUser(userId);

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
    const user = await this.userService.validateUser(userId);

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

  // ======== Private 메서드 ===========

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
}
