import { Test, TestingModule } from '@nestjs/testing';
import { ConsentType } from '@prisma/client';
import { NotificationService } from './notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationField } from './enums/notification-field.enum';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
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
          update: { benefitAlert: true, nightAlert: true },
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
});
