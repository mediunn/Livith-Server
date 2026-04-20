import { Test, TestingModule } from '@nestjs/testing';
import { TicketingReminderScheduler } from '../scheduler/ticketing-reminder.scheduler';
import { NotificationService } from '../service/notification.service';
import { NotificationHistoryService } from '../service/notification-history.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationType, ScheduleType } from '@prisma/client';
import { SchedulerMetricsService } from 'src/metrics/scheduler-metrics.service';

describe('TicketingReminderScheduler', () => {
  let scheduler: TicketingReminderScheduler;
  let notificationService: NotificationService;
  let historyService: NotificationHistoryService;

  const mockPrisma = {
    schedule: { findMany: jest.fn() },
  };

  const mockNotificationService = {
    sendTicketReminderNotification: jest
      .fn()
      .mockResolvedValue({ sent: 1, failed: 0 }),
  };

  const mockHistoryService = {
    existsByScheduleAndType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketingReminderScheduler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationHistoryService, useValue: mockHistoryService },
        {
          provide: SchedulerMetricsService,
          useValue: {
            executionCounter: { inc: jest.fn() },
            durationHistogram: {
              startTimer: jest.fn().mockReturnValue(() => {}),
            },
            successCounter: { inc: jest.fn() },
            failureCounter: { inc: jest.fn() },
            itemsProcessed: { inc: jest.fn() },
            lastSuccessTimestamp: { set: jest.fn() },
          },
        },
      ],
    }).compile();

    scheduler = module.get(TicketingReminderScheduler);
    notificationService = module.get(NotificationService);
    historyService = module.get(NotificationHistoryService);
    jest.clearAllMocks();
  });

  describe('oneDayBeforeNotification', () => {
    it('PRE_TICKETING schedule 이 있으면 PRE_TICKETING_1D 로 발송', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([
          {
            id: 10,
            concertId: 1,
            concert: { id: 1, title: '선예매콘서트' },
            scheduledAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([]);

      await scheduler.oneDayBeforeNotification();

      expect(
        notificationService.sendTicketReminderNotification,
      ).toHaveBeenCalledWith(
        NotificationType.PRE_TICKETING_1D,
        expect.objectContaining({
          scheduleId: 10,
          concertTitle: '선예매콘서트',
          daysUntil: 1,
        }),
        '1',
      );
    });

    it('GENERAL_TICKETING schedule 이 있으면 GENERAL_TICKETING_1D 로 발송', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 20,
            concertId: 2,
            concert: { id: 2, title: '일반예매콘서트' },
            scheduledAt: new Date(),
          },
        ]);

      await scheduler.oneDayBeforeNotification();

      expect(
        notificationService.sendTicketReminderNotification,
      ).toHaveBeenCalledWith(
        NotificationType.GENERAL_TICKETING_1D,
        expect.objectContaining({
          scheduleId: 20,
          concertTitle: '일반예매콘서트',
          daysUntil: 1,
        }),
        '2',
      );
    });

    it('PRE + GENERAL 둘 다 있으면 각각 발송 총합 반환', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([
          {
            id: 10,
            concertId: 1,
            concert: { id: 1, title: '선' },
            scheduledAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 20,
            concertId: 2,
            concert: { id: 2, title: '일반' },
            scheduledAt: new Date(),
          },
        ]);

      const total = await scheduler.oneDayBeforeNotification();

      expect(total).toBe(2);
      expect(
        notificationService.sendTicketReminderNotification,
      ).toHaveBeenCalledTimes(2);
    });

    it('ScheduleType 으로 쿼리 필터링한다 (CONCERT 아님)', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([]);

      await scheduler.oneDayBeforeNotification();

      expect(mockPrisma.schedule.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            type: ScheduleType.PRE_TICKETING,
          }),
        }),
      );
      expect(mockPrisma.schedule.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            type: ScheduleType.GENERAL_TICKETING,
          }),
        }),
      );
    });
  });

  describe('thirtyMinBeforeNotifications', () => {
    it('이미 발송된 schedule 은 건너뛴다 (dedup)', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([
          {
            id: 100,
            concertId: 5,
            concert: { id: 5, title: '중복' },
            scheduledAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([]);
      mockHistoryService.existsByScheduleAndType.mockResolvedValue(true);

      const count = await scheduler.thirtyMinBeforeNotifications();

      expect(count).toBe(0);
      expect(
        notificationService.sendTicketReminderNotification,
      ).not.toHaveBeenCalled();
    });

    it('발송 이력 없으면 PRE_TICKETING_30MIN 으로 발송', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([
          {
            id: 101,
            concertId: 6,
            concert: { id: 6, title: '신규' },
            scheduledAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([]);
      mockHistoryService.existsByScheduleAndType.mockResolvedValue(false);

      const count = await scheduler.thirtyMinBeforeNotifications();

      expect(count).toBe(1);
      expect(
        notificationService.sendTicketReminderNotification,
      ).toHaveBeenCalledWith(
        NotificationType.PRE_TICKETING_30MIN,
        expect.objectContaining({
          scheduleId: 101,
          concertTitle: '신규',
          daysUntil: 0,
        }),
        '6',
      );
    });

    it('29~31분 윈도우로 조회한다', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([]);

      const before = Date.now();
      await scheduler.thirtyMinBeforeNotifications();

      const firstCallWhere =
        mockPrisma.schedule.findMany.mock.calls[0][0].where;
      const { gte, lte } = firstCallWhere.scheduledAt;

      // 29분 ~ 31분 윈도우 검증 (실행 시간 오차 고려)
      expect(gte.getTime()).toBeGreaterThanOrEqual(before + 29 * 60 * 1000);
      expect(lte.getTime()).toBeLessThanOrEqual(before + 31 * 60 * 1000 + 1000);
    });
  });

  describe('openTimeNotifications', () => {
    it('이미 발송된 schedule 은 건너뛴다 (dedup)', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([
          {
            id: 200,
            concertId: 9,
            concert: { id: 9, title: '오픈중복' },
            scheduledAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([]);
      mockHistoryService.existsByScheduleAndType.mockResolvedValue(true);

      const count = await scheduler.openTimeNotifications();

      expect(count).toBe(0);
      expect(
        notificationService.sendTicketReminderNotification,
      ).not.toHaveBeenCalled();
    });

    it('발송 이력 없으면 GENERAL_TICKETING_OPEN 으로 발송', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 201,
            concertId: 10,
            concert: { id: 10, title: '오픈신규' },
            scheduledAt: new Date(),
          },
        ]);
      mockHistoryService.existsByScheduleAndType.mockResolvedValue(false);

      const count = await scheduler.openTimeNotifications();

      expect(count).toBe(1);
      expect(
        notificationService.sendTicketReminderNotification,
      ).toHaveBeenCalledWith(
        NotificationType.GENERAL_TICKETING_OPEN,
        expect.objectContaining({
          scheduleId: 201,
          concertTitle: '오픈신규',
          daysUntil: 0,
        }),
        '10',
      );
    });

    it('과거 5분 ~ 현재 윈도우로 조회한다', async () => {
      mockPrisma.schedule.findMany.mockResolvedValue([]);

      const before = Date.now();
      await scheduler.openTimeNotifications();

      const firstCallWhere =
        mockPrisma.schedule.findMany.mock.calls[0][0].where;
      const { gte, lte } = firstCallWhere.scheduledAt;

      expect(gte.getTime()).toBeGreaterThanOrEqual(before - 5 * 60 * 1000);
      expect(lte.getTime()).toBeLessThanOrEqual(before + 1000);
    });

    it('dedup 체크를 각 schedule 마다 호출', async () => {
      mockPrisma.schedule.findMany
        .mockResolvedValueOnce([
          {
            id: 301,
            concertId: 11,
            concert: { id: 11, title: 'a' },
            scheduledAt: new Date(),
          },
          {
            id: 302,
            concertId: 12,
            concert: { id: 12, title: 'b' },
            scheduledAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([]);
      mockHistoryService.existsByScheduleAndType.mockResolvedValue(false);

      await scheduler.openTimeNotifications();

      expect(historyService.existsByScheduleAndType).toHaveBeenCalledWith(
        301,
        NotificationType.PRE_TICKETING_OPEN,
      );
      expect(historyService.existsByScheduleAndType).toHaveBeenCalledWith(
        302,
        NotificationType.PRE_TICKETING_OPEN,
      );
    });
  });
});
