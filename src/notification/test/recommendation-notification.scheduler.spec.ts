import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { RecommendationNotificationScheduler } from '../scheduler/recommendation-notification.scheduler';
import { RecommendationService } from 'src/recommendation/services/recommendation.service';
import { NotificationService } from '../service/notification.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';

describe('RecommendationNotificationScheduler', () => {
  let scheduler: RecommendationNotificationScheduler;
  let notificationService: NotificationService;

  const mockRecommendationService = { getRecommendConcerts: jest.fn() };

  const mockStrategy = {
    getTargetUserIds: jest.fn(),
    buildMessage: jest.fn(),
  };

  const mockStrategyService = {
    getStrategy: jest.fn().mockReturnValue(mockStrategy),
  };

  const mockNotificationService = {
    sendPushNotification: jest.fn().mockResolvedValue({ sent: 1, failed: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationNotificationScheduler,
        { provide: RecommendationService, useValue: mockRecommendationService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationStrategyService, useValue: mockStrategyService },
      ],
    }).compile();

    scheduler = module.get(RecommendationNotificationScheduler);
    notificationService = module.get(NotificationService);
    jest.clearAllMocks();
  });

  it('Strategy로 유저 조회 후 추천 콘서트 있으면 RECOMMEND 푸시 발송', async () => {
    mockStrategy.getTargetUserIds.mockResolvedValue([1, 2]);
    mockStrategy.buildMessage.mockResolvedValue({
      title: '추천 콘서트',
      content:
        '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!',
    });
    mockRecommendationService.getRecommendConcerts
      .mockResolvedValueOnce([{ id: 100, title: 'A' }])
      .mockResolvedValueOnce([]);

    await scheduler.sendWeeklyRecommendNotifications();

    expect(mockStrategyService.getStrategy).toHaveBeenCalledWith(
      NotificationType.RECOMMEND,
    );
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

  it('Strategy가 빈 유저 목록 반환하면 발송 없음', async () => {
    mockStrategy.getTargetUserIds.mockResolvedValue([]);

    await scheduler.sendWeeklyRecommendNotifications();

    expect(notificationService.sendPushNotification).not.toHaveBeenCalled();
  });
});
