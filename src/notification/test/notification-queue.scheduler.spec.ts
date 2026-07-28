import { Test, TestingModule } from '@nestjs/testing';
import { NotificationQueueScheduler } from '../scheduler/notification-queue.scheduler';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';
import { ConcertInfoUpdateType } from '../enums/concert-info-update-type.enum';
import { SchedulerMetricsService } from 'src/metrics/scheduler-metrics.service';

describe('NotificationQueueScheduler', () => {
  let scheduler: NotificationQueueScheduler;
  let notificationService: NotificationService;

  const mockPrisma = {
    concertNotificationQueue: {
      findMany: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationQueueScheduler,
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
        {
          provide: NotificationService,
          useValue: {
            sendArtistConcertOpenNotification: jest
              .fn()
              .mockResolvedValue({ sent: 1, failed: 0 }),
            sendConcertInfoUpdateNotification: jest
              .fn()
              .mockResolvedValue({ sent: 1, failed: 0 }),
          },
        },
      ],
    }).compile();

    scheduler = module.get(NotificationQueueScheduler);
    notificationService = module.get(NotificationService);
    jest.clearAllMocks();
    mockPrisma.concertNotificationQueue.update.mockResolvedValue({});
  });

  it('ARTIST_CONCERT_OPEN 큐 행이면 sendArtistConcertOpenNotification 호출 후 processed=true', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 1,
        concertId: 10,
        eventType: 'ARTIST_CONCERT_OPEN',
        processed: false,
      },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendArtistConcertOpenNotification,
    ).toHaveBeenCalledWith(10);
    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { processed: true },
    });
  });

  it('CONCERT_INFO_UPDATE_CONCERT_DETAIL 큐 행이면 updateType=CONCERT_DETAIL로 호출', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 2,
        concertId: 20,
        eventType: 'CONCERT_INFO_UPDATE_CONCERT_DETAIL',
        processed: false,
      },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendConcertInfoUpdateNotification,
    ).toHaveBeenCalledWith(20, ConcertInfoUpdateType.CONCERT_DETAIL);
    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { processed: true },
    });
  });

  it('CONCERT_INFO_UPDATE_SETLIST 큐 행이면 updateType=SETLIST로 호출', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 3,
        concertId: 30,
        eventType: 'CONCERT_INFO_UPDATE_SETLIST',
        processed: false,
      },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendConcertInfoUpdateNotification,
    ).toHaveBeenCalledWith(30, ConcertInfoUpdateType.SETLIST);
  });

  it('CONCERT_INFO_UPDATE_MD_INFO 큐 행이면 updateType=MD_INFO로 호출', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 4,
        concertId: 40,
        eventType: 'CONCERT_INFO_UPDATE_MD_INFO',
        processed: false,
      },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendConcertInfoUpdateNotification,
    ).toHaveBeenCalledWith(40, ConcertInfoUpdateType.MD_INFO);
  });

  it('CONCERT_INFO_UPDATE_SCHEDULE 큐 행이면 updateType=SCHEDULE로 호출', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 5,
        concertId: 50,
        eventType: 'CONCERT_INFO_UPDATE_SCHEDULE',
        processed: false,
      },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendConcertInfoUpdateNotification,
    ).toHaveBeenCalledWith(50, ConcertInfoUpdateType.SCHEDULE);
  });

  it('CONCERT_INFO_UPDATE_TICKET 큐 행이면 updateType=TICKET로 호출', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 6,
        concertId: 60,
        eventType: 'CONCERT_INFO_UPDATE_TICKET',
        processed: false,
      },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendConcertInfoUpdateNotification,
    ).toHaveBeenCalledWith(60, ConcertInfoUpdateType.TICKET);
    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 6 },
      data: { processed: true },
    });
  });

  it('24h 초과 미처리 행은 발송 없이 폐기(processed=true)', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 7,
        concertId: 70,
        eventType: 'ARTIST_CONCERT_OPEN',
        processed: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendArtistConcertOpenNotification,
    ).not.toHaveBeenCalled();
    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { processed: true },
    });
  });

  it('미인식 eventType 은 발송 없이 폐기되지만 processed=true (조용한 드롭 방지 로깅)', async () => {
    const warnSpy = jest
      .spyOn((scheduler as any).logger, 'warn')
      .mockImplementation(() => undefined);
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      { id: 8, concertId: 80, eventType: 'UNKNOWN_EVENT', processed: false },
    ]);

    await scheduler.processQueue();

    expect(
      notificationService.sendArtistConcertOpenNotification,
    ).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unhandled eventType=UNKNOWN_EVENT'),
    );
    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { processed: true },
    });
  });

  it('dispatch 실패해도 processed=true (head-of-line 블로킹 방지)', async () => {
    jest
      .spyOn((scheduler as any).logger, 'warn')
      .mockImplementation(() => undefined);
    (
      notificationService.sendArtistConcertOpenNotification as jest.Mock
    ).mockRejectedValueOnce(new Error('boom'));
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      {
        id: 9,
        concertId: 90,
        eventType: 'ARTIST_CONCERT_OPEN',
        processed: false,
      },
    ]);

    await scheduler.processQueue();

    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { processed: true },
    });
  });

  it('이전 실행 진행 중이면 이번 틱은 skip (오버랩 가드)', async () => {
    let release: (v: unknown[]) => void;
    const pending = new Promise<unknown[]>((r) => {
      release = r;
    });
    mockPrisma.concertNotificationQueue.findMany.mockReturnValueOnce(pending);

    const first = scheduler.processQueue();
    const second = await scheduler.processQueue(); // 진행 중 → skip

    expect(second).toBe(0);

    release([]);
    await first;
    expect(mockPrisma.concertNotificationQueue.findMany).toHaveBeenCalledTimes(
      1,
    );
  });
});
