import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { NotificationSettingsService } from '../service/notification-settings.service';
import { FcmTokenService } from '../service/fcm-token.service';
import { NotificationHistoryService } from '../service/notification-history.service';
import { PushSenderService } from '../service/push-sender.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';

describe('NotificationService (푸시 발송)', () => {
  let service: NotificationService;

  const mockPushSenderService = {
    sendPushNotification: jest.fn(),
  };

  const mockHistoryService = {
    createNotificationHistories: jest.fn(),
  };

  const mockSettingsService = {};
  const mockFcmTokenService = {};
  const mockStrategyService = {
    getStrategy: jest.fn(),
    createTicketReminderStrategy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
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

  describe('sendPushNotification', () => {
    it('PushSenderService에 위임하여 푸시 발송', async () => {
      mockPushSenderService.sendPushNotification.mockResolvedValue({
        sent: 2,
        failed: 0,
        sentUserIds: [1, 2],
        finalTitle: '제목',
        finalContent: '내용',
      });

      const result = await service.sendPushNotification({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        targetId: '123',
        userIds: [1, 2],
      });

      expect(mockPushSenderService.sendPushNotification).toHaveBeenCalledWith({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        targetId: '123',
        userIds: [1, 2],
      });
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('발송 성공 시 히스토리 생성 호출', async () => {
      mockPushSenderService.sendPushNotification.mockResolvedValue({
        sent: 1,
        failed: 0,
        sentUserIds: [1],
        finalTitle: '제목',
        finalContent: '내용',
      });
      mockHistoryService.createNotificationHistories.mockResolvedValue(
        undefined,
      );

      await service.sendPushNotification({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        targetId: '123',
        userIds: [1],
      });

      expect(
        mockHistoryService.createNotificationHistories,
      ).toHaveBeenCalledWith(
        [1],
        NotificationType.CONCERT_INFO_UPDATE,
        '제목',
        '내용',
        '123',
      );
    });

    it('발송 대상 없으면 히스토리 생성 안 함', async () => {
      mockPushSenderService.sendPushNotification.mockResolvedValue({
        sent: 0,
        failed: 0,
        sentUserIds: [],
        finalTitle: '제목',
        finalContent: '내용',
      });

      await service.sendPushNotification({
        type: NotificationType.CONCERT_INFO_UPDATE,
        title: '제목',
        content: '내용',
        userIds: [],
      });

      expect(
        mockHistoryService.createNotificationHistories,
      ).not.toHaveBeenCalled();
    });
  });
});
