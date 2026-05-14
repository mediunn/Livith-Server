import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationField } from '../enums/notification-field.enum';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';
import { NotificationSettingsService } from '../service/notification-settings.service';
import { FcmTokenService } from '../service/fcm-token.service';
import { NotificationHistoryService } from '../service/notification-history.service';
import { PushSenderService } from '../service/push-sender.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockPrisma = {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    concert: { findUnique: jest.fn() },
    representativeArtist: { findMany: jest.fn() },
    userArtist: { findMany: jest.fn() },
    notificationSet: { upsert: jest.fn() },
    notificationConsent: { create: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  const mockFcmTokenService = {};
  const mockPushSenderService = {};

  const mockSettingsService = {
    getNotificationSettings: jest.fn(),
    agreeMarketingConsent: jest.fn(),
    createNotificationConsent: jest.fn(),
  };

  const mockHistoryService = {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    createNotificationHistories: jest.fn(),
  };

  const mockStrategy = {
    getTargetUserIds: jest.fn(),
    buildMessage: jest.fn(),
  };

  const mockStrategyService = {
    getStrategy: jest.fn().mockReturnValue(mockStrategy),
    createTicketReminderStrategy: jest.fn().mockReturnValue(mockStrategy),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationSettingsService, useValue: mockSettingsService },
        { provide: FcmTokenService, useValue: mockFcmTokenService },
        { provide: NotificationHistoryService, useValue: mockHistoryService },
        { provide: PushSenderService, useValue: mockPushSenderService },
        { provide: NotificationStrategyService, useValue: mockStrategyService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('getNotificationSettings', () => {
    it('settingsService에 위임하여 알림 설정을 조회', async () => {
      // Given
      mockSettingsService.getNotificationSettings.mockResolvedValue({
        benefitAlert: false,
        nightAlert: false,
        ticketAlert: true,
        infoAlert: true,
        interestAlert: true,
        recommendAlert: true,
      });

      // When
      const result = await service.getNotificationSettings(1);

      // Then
      expect(mockSettingsService.getNotificationSettings).toHaveBeenCalledWith(
        1,
      );
      expect(result.ticketAlert).toBe(true);
      expect(result.benefitAlert).toBe(false);
    });
  });

  describe('agreeMarketingConsent', () => {
    it('settingsService에 위임하여 마케팅 동의 처리', async () => {
      // Given
      mockSettingsService.agreeMarketingConsent.mockResolvedValue({
        message: '알림 동의 처리 완료',
      });

      // When
      const result = await service.agreeMarketingConsent(1);

      // Then
      expect(mockSettingsService.agreeMarketingConsent).toHaveBeenCalledWith(1);
      expect(result.message).toBe('알림 동의 처리 완료');
    });
  });

  describe('createNotificationConsent', () => {
    it('settingsService에 위임하여 알림 동의 생성', async () => {
      // Given
      mockSettingsService.createNotificationConsent.mockResolvedValue({
        message: '알림 설정이 변경되었습니다.',
      });

      // When
      const result = await service.createNotificationConsent(
        1,
        NotificationField.TICKET_ALERT,
        false,
      );

      // Then
      expect(
        mockSettingsService.createNotificationConsent,
      ).toHaveBeenCalledWith(1, NotificationField.TICKET_ALERT, false);
      expect(result.message).toBe('알림 설정이 변경되었습니다.');
    });
  });

  describe('sendConcertInfoUpdateNotification', () => {
    it('Strategy가 유저와 메시지를 반환하면 sendPushNotification 호출', async () => {
      mockStrategy.getTargetUserIds.mockResolvedValue([10, 20]);
      mockStrategy.buildMessage.mockResolvedValue({
        title: '콘서트 정보 업데이트',
        content: '테스트 콘서트 정보가 업데이트되었어요!',
      });

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 2, failed: 0 });

      await service.sendConcertInfoUpdateNotification(
        1,
        ConcertInfoUpdateType.SETLIST,
      );

      expect(mockStrategyService.getStrategy).toHaveBeenCalledWith(
        NotificationType.CONCERT_INFO_UPDATE_SETLIST,
      );
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.CONCERT_INFO_UPDATE_SETLIST,
          title: '콘서트 정보 업데이트',
          content: '테스트 콘서트 정보가 업데이트되었어요!',
          targetId: '1',
        }),
      );
    });

    it('Strategy가 빈 유저 목록 반환하면 발송 없음', async () => {
      mockStrategy.getTargetUserIds.mockResolvedValue([]);

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 0, failed: 0 });

      await service.sendConcertInfoUpdateNotification(
        999,
        ConcertInfoUpdateType.SETLIST,
      );

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendArtistConcertOpenNotification', () => {
    it('Strategy가 유저와 메시지를 반환하면 sendPushNotification 호출', async () => {
      mockStrategy.getTargetUserIds.mockResolvedValue([10, 20]);
      mockStrategy.buildMessage.mockResolvedValue({
        title: '아티스트 콘서트 오픈',
        content: '아티스트 콘서트가 등록되었어요!',
      });

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 2, failed: 0 });

      await service.sendArtistConcertOpenNotification(1);

      expect(mockStrategyService.getStrategy).toHaveBeenCalledWith(
        NotificationType.ARTIST_CONCERT_OPEN,
      );
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.ARTIST_CONCERT_OPEN,
          title: '아티스트 콘서트 오픈',
          content: '아티스트 콘서트가 등록되었어요!',
          targetId: '1',
        }),
      );
    });

    it('Strategy가 빈 유저 목록 반환하면 발송 없음', async () => {
      mockStrategy.getTargetUserIds.mockResolvedValue([]);

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 0, failed: 0 });

      await service.sendArtistConcertOpenNotification(999);

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });
});
