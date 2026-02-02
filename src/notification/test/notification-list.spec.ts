import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotFoundException } from 'src/common/exceptions/business.exception';
import { ErrorCode } from 'src/common/enums/error-code.enum';

describe('NotificationService - 알림 목록', () => {
  let service: NotificationService;

  const mockPrisma = {
    user: { findUnique: jest.fn() },
    notificationHistories: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
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

  describe('getNotifications', () => {
    const mockNotifications = [
      {
        id: 3,
        userId: 1,
        type: NotificationType.TICKET_7D,
        title: '예매 일정',
        content: '7일 뒤 예매 시작',
        targetId: '123',
        isRead: false,
        createdAt: new Date('2026.01.20'),
      },
      {
        id: 2,
        userId: 1,
        type: NotificationType.ARTIST_CONCERT_OPEN,
        title: '아티스트 콘서트 오픈',
        content: '콘서트 오픈',
        targetId: null,
        isRead: true,
        createdAt: new Date('2026.01.19'),
      },
      {
        id: 1,
        userId: 1,
        type: NotificationType.RECOMMEND,
        title: '(광고) 추천 콘서트',
        content: '추천 콘서트',
        targetId: '456',
        isRead: false,
        createdAt: new Date('2026.01.18'),
      },
    ];

    it('알림 목록 조회 - 성공 (cursor 없음)', async () => {
      // Given
      const userId = 1;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.findMany.mockResolvedValue(
        mockNotifications,
      );

      // When
      const result = await service.getNotifications(userId);

      // Then
      expect(mockPrisma.notificationHistories.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { id: 'desc' },
        take: 20,
      });
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(3);
      expect(result[0].createdAt).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
    });

    it('알림 목록 조회 - 성공(cursor 사용)', async () => {
      // Given
      const userId = 1;
      const cursor = 3;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.findMany.mockResolvedValue([
        mockNotifications[1],
        mockNotifications[2],
      ]);

      // When
      const result = await service.getNotifications(userId, cursor);

      // Then
      expect(mockPrisma.notificationHistories.findMany).toHaveBeenCalledWith({
        where: { userId, id: { lt: cursor } },
        orderBy: { id: 'desc' },
        take: 20,
      });
      expect(result).toHaveLength(2);
    });

    it('알림 목록 조회 - 성공(size 지정)', async () => {
      // Given
      const userId = 1;
      const size = 2;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.findMany.mockResolvedValue([
        mockNotifications[0],
        mockNotifications[1],
      ]);

      // When
      const result = await service.getNotifications(userId, undefined, size);

      // Then
      expect(mockPrisma.notificationHistories.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { id: 'desc' },
        take: size,
      });
      expect(result).toHaveLength(2);
    });

    it('존재하지 않는 유저 - 실패', async () => {
      // Given
      const userId = 999;
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(service.getNotifications(userId)).rejects.toThrow(
        new NotFoundException(ErrorCode.USER_NOT_FOUND),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('읽지 않은 알림 개수 조회 - 성공', async () => {
      // Given
      const userId = 1;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.count.mockResolvedValue(3);

      // When
      const result = await service.getUnreadCount(userId);

      // Then
      expect(mockPrisma.notificationHistories.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      });
      expect(result).toBe(3);
    });

    it('읽지 않은 알림 없음 - 성공', async () => {
      // Given
      const userId = 1;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.count.mockResolvedValue(0);

      // When
      const result = await service.getUnreadCount(userId);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('알림 읽음 처리 - 성공', async () => {
      // Given
      const userId = 1;
      const notificationId = 1;
      const mockNotification = {
        id: notificationId,
        userId,
        isRead: false,
      };
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.findUnique.mockResolvedValue(
        mockNotification,
      );
      mockPrisma.notificationHistories.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      // When
      await service.markAsRead(userId, notificationId);

      // Then
      expect(mockPrisma.notificationHistories.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(mockPrisma.notificationHistories.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { isRead: true },
      });
    });

    it('존재하지 않는 알림 - 실패', async () => {
      // Given
      const userId = 1;
      const notificationId = 999;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(service.markAsRead(userId, notificationId)).rejects.toThrow(
        new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND),
      );
    });
  });

  describe('deleteNotification', () => {
    it('알림 삭제 - 성공', async () => {
      // Given
      const userId = 1;
      const notificationId = 1;
      const mockNotification = {
        id: notificationId,
        userId,
      };
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.findUnique.mockResolvedValue(
        mockNotification,
      );
      mockPrisma.notificationHistories.delete.mockResolvedValue(
        mockNotification,
      );

      // When
      await service.deleteNotification(userId, notificationId);

      // Then
      expect(mockPrisma.notificationHistories.findUnique).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(mockPrisma.notificationHistories.delete).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
    });

    it('존재하지 않는 알림 - 실패', async () => {
      // Given
      const userId = 1;
      const notificationId = 999;
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });
      mockPrisma.notificationHistories.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(
        service.deleteNotification(userId, notificationId),
      ).rejects.toThrow(
        new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND),
      );
    });
  });
});
