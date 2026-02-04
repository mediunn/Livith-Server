import { Test, TestingModule } from '@nestjs/testing';
import { ConsentType, NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationField } from '../enums/notification-field.enum';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('getNotificationSettings', () => {
    it('알림 설정을 조회', async () => {
      // Given
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        marketingConsent: false,
        deletedAt: null,
      });
      mockPrisma.notificationSet.upsert.mockResolvedValue({
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
      expect(result.ticketAlert).toBe(true);
      expect(result.benefitAlert).toBe(false);
    });
  });

  describe('agreeMarketingConsent', () => {
    it('마케팅 동의 시 홍보성 알림이 자동으로 켜짐', async () => {
      // Given
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        marketingConsent: false,
        deletedAt: null,
      });
      mockPrisma.user.update = jest.fn();
      mockPrisma.notificationSet.upsert.mockResolvedValue({});
      mockPrisma.notificationConsent.createMany.mockResolvedValue({});

      // When
      const result = await service.agreeMarketingConsent(1);

      // Then
      expect(result.message).toBe('알림 동의 처리 완료');
      expect(mockPrisma.notificationSet.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { benefitAlert: true },
        }),
      );
    });
  });

  describe('createNotificationConsent', () => {
    it('정보성 알림은 이력 저장 없이 변경', async () => {
      // Given
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        marketingConsent: true,
        deletedAt: null,
      });
      mockPrisma.notificationSet.upsert.mockResolvedValue({});

      // When
      await service.createNotificationConsent(
        1,
        NotificationField.TICKET_ALERT,
        false,
      );

      // Then
      expect(mockPrisma.notificationConsent.create).not.toHaveBeenCalled();
    });

    it('홍보성 알림 끄기는 이력이 저장', async () => {
      // Given
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        marketingConsent: true,
        deletedAt: null,
      });
      mockPrisma.notificationSet.upsert.mockResolvedValue({});
      mockPrisma.notificationConsent.create.mockResolvedValue({});

      // When
      await service.createNotificationConsent(
        1,
        NotificationField.BENEFIT_ALERT,
        false,
      );

      // Then
      expect(mockPrisma.notificationConsent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ConsentType.BENEFIT_PUSH,
          isAgreed: false,
        }),
      });
    });

    it('마케팅 동의 없이 홍보성 알림 켜면 마케팅 동의로 넘어감', async () => {
      // Given
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        marketingConsent: false,
        deletedAt: null,
      });
      mockPrisma.user.update = jest.fn();
      mockPrisma.notificationSet.upsert.mockResolvedValue({});
      mockPrisma.notificationConsent.createMany.mockResolvedValue({});

      // When
      const result = await service.createNotificationConsent(
        1,
        NotificationField.BENEFIT_ALERT,
        true,
      );

      // Then
      expect(result.message).toBe('알림 동의 처리 완료');
      expect(mockPrisma.notificationSet.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { benefitAlert: true },
        }),
      );
    });
  });

  describe('sendConcertInfoUpdateNotification', () => {
    it('콘서트 존재, 관심 유저 잇으면 CONCERT_INFO_UPDATE로 sendPushNotification 호출', async () => {
      mockPrisma.concert = { findUnique: jest.fn() };
      mockPrisma.user = { ...mockPrisma.user, findMany: jest.fn() };
      (mockPrisma.concert.findUnique as jest.Mock).mockResolvedValue({
        title: '테스트 콘서트',
      });
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 10 },
        { id: 20 },
      ]);

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 2, failed: 0 });

      await service.sendConcertInfoUpdateNotification(1);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.CONCERT_INFO_UPDATE,
          title: '콘서트 정보 업데이트',
          content: '테스트 콘서트 정보가 업데이트되었어요!',
          targetId: '1',
          userIds: [10, 20],
        }),
      );
    });

    it('콘서트 없으면 발송 없음', async () => {
      mockPrisma.concert = { findUnique: jest.fn() };
      (mockPrisma.concert.findUnique as jest.Mock).mockResolvedValue(null);

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 0, failed: 0 });

      await service.sendConcertInfoUpdateNotification(999);

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendArtistConcertOpenNotification', () => {
    it('콘서트 매칭, 아티스트, 유저 있으면 ARTIST_CONCERT_OPEN으로 sendPushNotification 호출', async () => {
      mockPrisma.concert = { findUnique: jest.fn() };
      mockPrisma.representativeArtist = { findMany: jest.fn() };
      mockPrisma.userArtist = { findMany: jest.fn() };
      mockPrisma.user = { ...mockPrisma.user, findMany: jest.fn() };

      (mockPrisma.concert.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        title: '콘서트',
        artist: '아티스트',
      });
      (mockPrisma.representativeArtist.findMany as jest.Mock).mockResolvedValue(
        [{ id: 5, artistName: '아티스트' }],
      );
      (mockPrisma.userArtist.findMany as jest.Mock).mockResolvedValue([
        { userId: 10 },
        { userId: 20 },
      ]);
      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 10 },
        { id: 20 },
      ]);

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 2, failed: 0 });

      await service.sendArtistConcertOpenNotification(1);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.ARTIST_CONCERT_OPEN,
          title: '아티스트 콘서트 오픈',
          content: '아티스트 콘서트가 등록되었어요!',
          targetId: '1',
          userIds: [10, 20],
        }),
      );
    });

    it('콘서트 없으면 발송 없음', async () => {
      mockPrisma.concert = { findUnique: jest.fn() };
      (mockPrisma.concert.findUnique as jest.Mock).mockResolvedValue(null);

      const sendSpy = jest
        .spyOn(service, 'sendPushNotification')
        .mockResolvedValue({ sent: 0, failed: 0 });

      await service.sendArtistConcertOpenNotification(999);

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });
});
