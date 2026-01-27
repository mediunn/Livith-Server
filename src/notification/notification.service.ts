import { Injectable } from '@nestjs/common';
import { ConsentType, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from 'src/common/exceptions/business.exception';
import { FIELD_TO_CONSENT_TYPE, NOTIFICATION_DEFAULTS, PROMOTIONAL_FIELDS } from './constants/notification.constants';
import { NotificationField } from './enums/notification-field.enum';
import { NotificationConsentResponseDto } from './dto/response/notification-consent-response.dto';
import { NotificationSettingResponseDto } from './dto/response/notification-set-response.dto';

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
      await tx.notificationSet.upsert({
        where: {userId},
        update:{
          benefitAlert: true,
          nightAlert: true,
        },
        create:{
          userId,
          ...NOTIFICATION_DEFAULTS,
          benefitAlert: true,
          nightAlert: true,
        },
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
      await tx.notificationSet.upsert({
        where: { userId },
        update: { [field]: isAgreed },
        create: { userId, ...NOTIFICATION_DEFAULTS, [field]: isAgreed },
      });

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
