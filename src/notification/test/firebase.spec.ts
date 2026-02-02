import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { PrismaService } from 'prisma/prisma.service';

jest.mock('./firebase-admin', () => ({
  getMessaging: jest.fn(),
  admin: {},
}));

jest.mock('src/common/utils/date.util', () => ({
  isNightTimeKst: jest.fn(() => false),
}));

describe('NotificationService (푸시 발송)', () => {
  let service: NotificationService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    notificationSet: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    notificationConsent: { create: jest.fn(), createMany: jest.fn() },
    fcmToken: { findMany: jest.fn(), deleteMany: jest.fn() },
    notificationHistories: { createMany: jest.fn() },
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

    require('./firebase-admin').getMessaging.mockReturnValue({
      sendEachForMulticast: jest.fn().mockResolvedValue({
        successCount: 2,
        responses: [{ success: true }, { success: true }],
      }),
    });
  });

  describe('sendPushNotification', () => {
    it('userIds가 비어 있으면 { sent: 0, failed: 0 } 반환', async () => {
      const result = await service.sendPushNotification({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        userIds: [],
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(mockPrisma.notificationSet.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.fcmToken.findMany).not.toHaveBeenCalled();
    });

    it('타입별 설정이 꺼진 유저만 있으면 발송 대상 없어 { sent: 0, failed: 0 }', async () => {
      mockPrisma.notificationSet.findMany.mockResolvedValue([
        { userId: 1, infoAlert: false, nightAlert: false },
      ]);

      const result = await service.sendPushNotification({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        userIds: [1],
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(mockPrisma.fcmToken.findMany).not.toHaveBeenCalled();
    });

    it('FCM 토큰이 없으면 { sent: 0, failed: 0 }', async () => {
      mockPrisma.notificationSet.findMany.mockResolvedValue([
        { userId: 1, infoAlert: true, nightAlert: false },
      ]);
      mockPrisma.fcmToken.findMany.mockResolvedValue([]);

      const result = await service.sendPushNotification({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        userIds: [1],
      });

      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(
        mockPrisma.notificationHistories.createMany,
      ).not.toHaveBeenCalled();
    });

    it('대상 유저·토큰 있으면 FCM 발송 후 createMany 호출하고 sent 반환', async () => {
      mockPrisma.notificationSet.findMany.mockResolvedValue([
        { userId: 1, infoAlert: true, nightAlert: false },
      ]);
      mockPrisma.fcmToken.findMany.mockResolvedValue([
        { token: 'token-a', userId: 1 },
        { token: 'token-b', userId: 1 },
      ]);
      mockPrisma.notificationHistories.createMany.mockResolvedValue({});

      const result = await service.sendPushNotification({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        targetId: '123',
        userIds: [1],
      });

      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockPrisma.notificationHistories.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 1,
            type: NotificationType.CONCERT_INFO_UPDATE,
            title: '제목',
            content: '내용',
            targetId: '123',
            isRead: false,
          },
        ],
      });
    });

    it('RECOMMEND 타입이면 title/content에 홍보 문구 가공되어 저장', async () => {
      mockPrisma.notificationSet.findMany.mockResolvedValue([
        { userId: 1, recommendAlert: true, nightAlert: false },
      ]);
      mockPrisma.fcmToken.findMany.mockResolvedValue([
        { token: 'token-a', userId: 1 },
      ]);
      mockPrisma.notificationHistories.createMany.mockResolvedValue({});

      await service.sendPushNotification({
        type: NotificationType.RECOMMEND,
        title: '추천',
        content: '내용',
        userIds: [1],
      });

      expect(mockPrisma.notificationHistories.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            title: '(광고) 추천',
            content: expect.stringContaining('수신 거부'),
          }),
        ],
      });
    });
  });
});
