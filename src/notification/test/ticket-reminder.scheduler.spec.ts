import { Test, TestingModule } from '@nestjs/testing';
import { TicketingReminderScheduler } from '../scheduler/ticketing-reminder.scheduler';
import { NotificationService } from '../service/notification.service';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationType } from '@prisma/client';

describe('TicketingReminderScheduler', () => {
  let scheduler: TicketingReminderScheduler;
  let notificationService: NotificationService;

  const mockPrisma = {
    schedule: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketingReminderScheduler,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificationService,
          useValue: {
            sendPushNotification: jest
              .fn()
              .mockResolvedValue({ sent: 1, failed: 0 }),
          },
        },
      ],
    }).compile();

    scheduler = module.get(TicketingReminderScheduler);
    notificationService = module.get(NotificationService);
    jest.clearAllMocks();
  });

  it('7일 후 TICKETING 스케줄 있으면 TICKET_7D로 sendPushNotification 호출', async () => {
    mockPrisma.schedule.findMany
      .mockResolvedValueOnce([
        {
          concertId: 1,
          concert: { id: 1, title: '테스트콘서트' },
          scheduledAt: new Date(),
        },
      ])
      .mockResolvedValue([]); // 1일, 오늘 스케줄은 없음
    mockPrisma.user.findMany
      .mockResolvedValueOnce([{ id: 10 }])
      .mockResolvedValue([]); // 페이지네이션 종료

    await scheduler.dailyTicketingNotifications();

    expect(notificationService.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.TICKET_7D,
        title: '예매 일정',
        content: '테스트콘서트 예매가 7일 뒤에 시작해요!',
        targetId: '1',
        userIds: [10],
      }),
    );
  });

  it('당일 TICKETING 스케줄 있으면 TICKET_TODAY로 sendPushNotification 호출 (오늘 N시 문구)', async () => {
    const todayScheduleTime = new Date('2025-01-23T11:00:00Z');
    mockPrisma.schedule.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          concertId: 2,
          concert: { id: 2, title: '당일콘서트' },
          scheduledAt: todayScheduleTime,
        },
      ]);
    mockPrisma.user.findMany
      .mockResolvedValueOnce([{ id: 20 }])
      .mockResolvedValue([]); // 페이지네이션 종료

    await scheduler.dailyTicketingNotifications();

    const sendCalls = (notificationService.sendPushNotification as jest.Mock)
      .mock.calls;
    const todayCall = sendCalls.find((c) => c[0].type === 'TICKET_TODAY');
    expect(todayCall).toBeDefined();
    expect(todayCall[0]).toMatchObject({
      type: 'TICKET_TODAY',
      title: '예매 일정',
      targetId: '2',
      userIds: [20],
    });
    expect(todayCall[0].content).toMatch(
      /당일콘서트 예매가 오늘 \d+시에 시작해요!/,
    );
  });
});
