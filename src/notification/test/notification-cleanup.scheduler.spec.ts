import { Test, TestingModule } from '@nestjs/testing';
import { NotificationCleanupScheduler } from '../scheduler/notification-cleanup.scheduler';
import { PrismaService } from 'prisma/prisma.service';
import { SchedulerMetricsService } from 'src/metrics/scheduler-metrics.service';

describe('NotificationCleanupScheduler', () => {
  let scheduler: NotificationCleanupScheduler;

  const mockPrisma = {
    notificationHistories: {
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationCleanupScheduler,
        { provide: PrismaService, useValue: mockPrisma },
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

    scheduler = module.get(NotificationCleanupScheduler);
    jest.clearAllMocks();
    mockPrisma.notificationHistories.deleteMany.mockResolvedValue({ count: 3 });
  });

  it('90일 이전 알림만 deleteMany로 설정', async () => {
    await scheduler.deleteOldNotifications();

    expect(mockPrisma.notificationHistories.deleteMany).toHaveBeenCalledTimes(
      1,
    );
    const call = mockPrisma.notificationHistories.deleteMany.mock.calls[0][0];
    expect(call.where.createdAt.lt).toBeInstanceOf(Date);
    const cutoff = call.where.createdAt.lt as Date;
    expect(Date.now() - cutoff.getTime()).toBeGreaterThanOrEqual(
      89 * 24 * 60 * 60 * 1000,
    );
  });
});
