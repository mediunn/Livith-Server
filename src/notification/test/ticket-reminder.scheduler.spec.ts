import { Test, TestingModule } from '@nestjs/testing';
import { TicketingReminderScheduler } from '../scheduler/ticketing-reminder.scheduler';
import { NotificationService } from '../service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { SchedulerMetricsService } from 'src/metrics/scheduler-metrics.service';

describe('TicketingReminderScheduler', () => {
  let scheduler: TicketingReminderScheduler;
  let notificationService: NotificationService;

  const mockPrisma = {
    schedule: { findMany: jest.fn() },
  };

  const mockNotificationService = {
    sendTicketReminderNotification: jest
      .fn()
      .mockResolvedValue({ sent: 1, failed: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketingReminderScheduler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
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
    jest.clearAllMocks();
  });

  it('7일 후 TICKETING 스케줄 있으면 sendTicketReminderNotification 호출', async () => {
    mockPrisma.schedule.findMany
      .mockResolvedValueOnce([
        {
          id: 1,
          concertId: 1,
          concert: { id: 1, title: '테스트콘서트' },
          scheduledAt: new Date(),
        },
      ])
      .mockResolvedValue([]); // 1일, 오늘 스케줄은 없음

    await scheduler.dailyTicketingNotifications();

    expect(
      notificationService.sendTicketReminderNotification,
    ).toHaveBeenCalledWith(
      NotificationType.TICKET_7D,
      expect.objectContaining({
        scheduleId: 1,
        concertTitle: '테스트콘서트',
        daysUntil: 7,
      }),
      '1',
    );
  });

  it('당일 TICKETING 스케줄 있으면 sendTicketReminderNotification 호출 (TICKET_TODAY)', async () => {
    const todayScheduleTime = new Date('2025-01-23T11:00:00Z');
    mockPrisma.schedule.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 2,
          concertId: 2,
          concert: { id: 2, title: '당일콘서트' },
          scheduledAt: todayScheduleTime,
        },
      ]);

    await scheduler.dailyTicketingNotifications();

    expect(
      notificationService.sendTicketReminderNotification,
    ).toHaveBeenCalledWith(
      NotificationType.TICKET_TODAY,
      expect.objectContaining({
        scheduleId: 2,
        concertTitle: '당일콘서트',
        daysUntil: 0,
      }),
      '2',
    );
  });
});
