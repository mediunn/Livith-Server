import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { NotFoundException } from 'src/common/exceptions/business.exception';
import { ErrorCode } from 'src/common/enums/error-code.enum';
import { NotificationSettingsService } from '../service/notification-settings.service';
import { FcmTokenService } from '../service/fcm-token.service';
import { NotificationHistoryService } from '../service/notification-history.service';
import { PushSenderService } from '../service/push-sender.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';

describe('NotificationService - 알림 목록', () => {
  let service: NotificationService;

  const mockNotifications = [
    {
      id: 3,
      userId: 1,
      type: NotificationType.TICKET_7D,
      title: '예매 일정',
      content: '7일 뒤 예매 시작',
      targetId: '123',
      isRead: false,
      createdAt: '2026.01.20 10:00',
    },
    {
      id: 2,
      userId: 1,
      type: NotificationType.ARTIST_CONCERT_OPEN,
      title: '아티스트 콘서트 오픈',
      content: '콘서트 오픈',
      targetId: null,
      isRead: true,
      createdAt: '2026.01.19 10:00',
    },
  ];

  const mockHistoryService = {
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  };

  const mockSettingsService = {};
  const mockFcmTokenService = {};
  const mockPushSenderService = {};
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

  describe('getNotifications', () => {
    it('historyService에 위임하여 알림 목록 조회', async () => {
      mockHistoryService.getNotifications.mockResolvedValue(mockNotifications);

      const result = await service.getNotifications(1);

      expect(mockHistoryService.getNotifications).toHaveBeenCalledWith(
        1,
        undefined,
        20,
      );
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(3);
    });

    it('cursor와 size 전달', async () => {
      mockHistoryService.getNotifications.mockResolvedValue([
        mockNotifications[1],
      ]);

      await service.getNotifications(1, 3, 10);

      expect(mockHistoryService.getNotifications).toHaveBeenCalledWith(
        1,
        3,
        10,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('historyService에 위임하여 읽지 않은 알림 개수 조회', async () => {
      mockHistoryService.getUnreadCount.mockResolvedValue(5);

      const result = await service.getUnreadCount(1);

      expect(mockHistoryService.getUnreadCount).toHaveBeenCalledWith(1);
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('historyService에 위임하여 알림 읽음 처리', async () => {
      mockHistoryService.markAsRead.mockResolvedValue(undefined);

      await service.markAsRead(1, 10);

      expect(mockHistoryService.markAsRead).toHaveBeenCalledWith(1, 10);
    });

    it('존재하지 않는 알림이면 예외 전파', async () => {
      mockHistoryService.markAsRead.mockRejectedValue(
        new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND),
      );

      await expect(service.markAsRead(1, 999)).rejects.toThrow(
        new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND),
      );
    });
  });

  describe('deleteNotification', () => {
    it('historyService에 위임하여 알림 삭제', async () => {
      mockHistoryService.deleteNotification.mockResolvedValue(undefined);

      await service.deleteNotification(1, 10);

      expect(mockHistoryService.deleteNotification).toHaveBeenCalledWith(1, 10);
    });

    it('존재하지 않는 알림이면 예외 전파', async () => {
      mockHistoryService.deleteNotification.mockRejectedValue(
        new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND),
      );

      await expect(service.deleteNotification(1, 999)).rejects.toThrow(
        new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND),
      );
    });
  });
});
