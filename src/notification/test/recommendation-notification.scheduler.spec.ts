import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { RecommendationNotificationScheduler } from '../scheduler/recommendation-notification.scheduler';
import { PrismaService } from 'prisma/prisma.service';
import { RecommendationService } from 'src/recommendation/services/recommendation.service';
import { NotificationService } from '../service/notification.service';

describe('RecommendationNotificationScheduler', () => {
  let scheduler: RecommendationNotificationScheduler;
  let notificationService: NotificationService;

  const mockPrisma = { user: { findMany: jest.fn() } };
  const mockRecommendationService = { getRecommendConcerts: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationNotificationScheduler,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RecommendationService, useValue: mockRecommendationService },
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

    scheduler = module.get(RecommendationNotificationScheduler);
    notificationService = module.get(NotificationService);
    jest.clearAllMocks();
  });

  it('관심 콘서트 없는 유저에게 추천 콘서트 1개 있으면 RECOMMEND 푸시 발송', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    mockRecommendationService.getRecommendConcerts
      .mockResolvedValueOnce([{ id: 100, title: 'A' }])
      .mockResolvedValueOnce([]);

    await scheduler.sendWeeklyRecommendNotifications();

    expect(notificationService.sendPushNotification).toHaveBeenCalledWith({
      type: NotificationType.RECOMMEND,
      title: '추천 콘서트',
      content:
        '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!',
      targetId: '100',
      userIds: [1],
    });
    expect(notificationService.sendPushNotification).toHaveBeenCalledTimes(1);
  });
});
