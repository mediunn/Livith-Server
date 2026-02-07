import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { RecommendationNotificationScheduler } from '../scheduler/recommendation-notification.scheduler';
import { RecommendationService } from 'src/recommendation/services/recommendation.service';
import { NotificationService } from '../service/notification.service';
import { NotificationStrategyService } from '../strategies/notification-strategy.service';
import { NotificationHistoryService } from '../service/notification-history.service';

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

  const mockHistoryService = {
    getSentRecommendConcertIds: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationNotificationScheduler,
        { provide: RecommendationService, useValue: mockRecommendationService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationStrategyService, useValue: mockStrategyService },
        { provide: NotificationHistoryService, useValue: mockHistoryService },
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

  it('이미 추천된 콘서트는 건너뛰고 다음 순위 콘서트로 발송', async () => {
    mockStrategy.getTargetUserIds.mockResolvedValue([1]);
    mockStrategy.buildMessage.mockResolvedValue({
      title: '추천 콘서트',
      content:
        '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!',
    });
    mockRecommendationService.getRecommendConcerts.mockResolvedValueOnce([
      { id: 100, title: 'A' },
      { id: 200, title: 'B' },
      { id: 300, title: 'C' },
    ]);
    mockHistoryService.getSentRecommendConcertIds.mockResolvedValueOnce([
      100, 200,
    ]);

    await scheduler.sendWeeklyRecommendNotifications();

    expect(notificationService.sendPushNotification).toHaveBeenCalledWith({
      type: NotificationType.RECOMMEND,
      title: '추천 콘서트',
      content:
        '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!',
      targetId: '300',
      userIds: [1],
    });
    expect(notificationService.sendPushNotification).toHaveBeenCalledTimes(1);
  });

  it('모든 추천 콘서트가 이미 발송된 경우 푸시 발송 없음', async () => {
    mockStrategy.getTargetUserIds.mockResolvedValue([1]);
    mockStrategy.buildMessage.mockResolvedValue({
      title: '추천 콘서트',
      content:
        '선택하신 취향을 바탕으로 지금 가장 잘 맞는 콘서트 하나를 골라봤어요!',
    });
    mockRecommendationService.getRecommendConcerts.mockResolvedValueOnce([
      { id: 100, title: 'A' },
      { id: 200, title: 'B' },
    ]);
    mockHistoryService.getSentRecommendConcertIds.mockResolvedValueOnce([
      100, 200,
    ]);

    await scheduler.sendWeeklyRecommendNotifications();

    expect(notificationService.sendPushNotification).not.toHaveBeenCalled();
  });
});
