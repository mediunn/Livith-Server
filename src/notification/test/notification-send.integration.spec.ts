import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationSettingsService } from '../service/notification-settings.service';
import { FcmTokenService } from '../service/fcm-token.service';
import { NotificationHistoryService } from '../service/notification-history.service';
import { PushSenderService } from '../service/push-sender.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';

const mockSendEachForMulticast = jest.fn();

jest.mock('../fcm/firebase-admin', () => ({
  getMessaging: jest.fn(() => ({
    sendEachForMulticast: mockSendEachForMulticast,
  })),
  admin: {},
}));

jest.mock('src/common/utils/date.util', () => ({
  isNightTimeKst: jest.fn(() => false),
}));

describe('Notification send integration (FCM mock)', () => {
  let service: NotificationService;

  const mockPrisma = {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    notificationSet: { upsert: jest.fn(), findMany: jest.fn() },
    notificationConsent: { create: jest.fn(), createMany: jest.fn() },
    fcmToken: { findMany: jest.fn(), deleteMany: jest.fn() },
    notificationHistories: { createMany: jest.fn() },
    $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) =>
      cb(mockPrisma),
    ),
  };

  const mockStrategyService = {
    getStrategy: jest.fn(),
    createTicketReminderStrategy: jest.fn(),
  };

  const mockSettingsService = {};
  const mockFcmTokenService = {};
  const mockHistoryService = {
    createNotificationHistories: jest.fn(),
  };

  beforeEach(async () => {
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      responses: [{ success: true }],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationSettingsService, useValue: mockSettingsService },
        { provide: FcmTokenService, useValue: mockFcmTokenService },
        { provide: NotificationHistoryService, useValue: mockHistoryService },
        PushSenderService,
        { provide: NotificationStrategyService, useValue: mockStrategyService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      responses: [{ success: true }],
    });
  });

  it('sendPushNotification 호출 시 FCM sendEachForMulticast에 기대한 payload로 호출됨', async () => {
    mockPrisma.notificationSet.findMany.mockResolvedValue([
      {
        userId: 1,
        ticketAlert: true,
        infoAlert: true,
        interestAlert: true,
        recommendAlert: false,
        nightAlert: false,
      },
    ]);
    mockPrisma.fcmToken.findMany.mockResolvedValue([
      { token: 'test-fcm-token-1', userId: 1 },
    ]);
    mockHistoryService.createNotificationHistories.mockResolvedValue(undefined);

    await service.sendPushNotification({
      type: NotificationType.TICKET_7D,
      title: '예매 일정',
      content: '테스트콘서트 예매가 7일 뒤에 시작해요!',
      targetId: '100',
      userIds: [1],
    });

    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    const [message] = mockSendEachForMulticast.mock.calls[0];
    expect(message.notification?.title).toBe('예매 일정');
    expect(message.notification?.body).toContain('테스트콘서트 예매가 7일 뒤');
    expect(message.data?.targetId).toBe('100');
    expect(message.tokens).toEqual(['test-fcm-token-1']);
  });

  it('발송 성공 시 historyService.createNotificationHistories 호출됨', async () => {
    mockPrisma.notificationSet.findMany.mockResolvedValue([
      {
        userId: 1,
        infoAlert: true,
        nightAlert: false,
        ticketAlert: true,
        interestAlert: true,
        recommendAlert: false,
      },
    ]);
    mockPrisma.fcmToken.findMany.mockResolvedValue([
      { token: 'token-a', userId: 1 },
    ]);
    mockHistoryService.createNotificationHistories.mockResolvedValue(undefined);

    await service.sendPushNotification({
      type: NotificationType.CONCERT_INFO_UPDATE_SETLIST,
      title: '콘서트 정보 업데이트',
      content: 'OOO 정보가 업데이트되었어요!',
      targetId: '50',
      userIds: [1],
    });

    expect(mockHistoryService.createNotificationHistories).toHaveBeenCalledWith(
      [1],
      NotificationType.CONCERT_INFO_UPDATE_SETLIST,
      '콘서트 정보 업데이트',
      'OOO 정보가 업데이트되었어요!',
      '50',
    );
  });

  it('FCM 실패 토큰 있으면 fcmToken.deleteMany 호출됨', async () => {
    mockPrisma.notificationSet.findMany.mockResolvedValue([
      {
        userId: 1,
        infoAlert: true,
        nightAlert: false,
        ticketAlert: true,
        interestAlert: true,
        recommendAlert: false,
      },
    ]);
    mockPrisma.fcmToken.findMany.mockResolvedValue([
      { token: 'invalid-token', userId: 1 },
    ]);
    mockPrisma.fcmToken.deleteMany.mockResolvedValue({ count: 1 });
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 0,
      responses: [
        {
          success: false,
          error: { code: 'messaging/invalid-registration-token' },
        },
      ],
    });

    const result = await service.sendPushNotification({
      type: NotificationType.CONCERT_INFO_UPDATE_SETLIST,
      title: '제목',
      content: '내용',
      userIds: [1],
    });

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    expect(mockPrisma.fcmToken.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ['invalid-token'] } },
    });
  });
});
