import { Test, TestingModule } from '@nestjs/testing';
import { NotificationQueueScheduler } from '../scheduler/notification-queue.scheduler';
import { PrismaService } from 'prisma/prisma.service';
import { NotificationService } from '../service/notification.service';

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
          provide: NotificationService,
          useValue: {
            sendArtistConcertOpenNotification: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
            sendConcertInfoUpdateNotification: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
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
      { id: 1, concertId: 10, eventType: 'ARTIST_CONCERT_OPEN', processed: false },
    ]);

    await scheduler.processQueue();

    expect(notificationService.sendArtistConcertOpenNotification).toHaveBeenCalledWith(10);
    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { processed: true },
    });
  });

  it('CONCERT_INFO_UPDATE 큐 행이면 sendConcertInfoUpdateNotification 호출 후 processed=true', async () => {
    mockPrisma.concertNotificationQueue.findMany.mockResolvedValue([
      { id: 2, concertId: 20, eventType: 'CONCERT_INFO_UPDATE', processed: false },
    ]);

    await scheduler.processQueue();

    expect(notificationService.sendConcertInfoUpdateNotification).toHaveBeenCalledWith(20);
    expect(mockPrisma.concertNotificationQueue.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { processed: true },
    });
  });
});