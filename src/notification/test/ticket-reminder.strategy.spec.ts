import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { TicketReminderStrategy } from '../strategies/ticket-reminder.strategy';

describe('TicketReminderStrategy.buildMessage', () => {
  let strategy: TicketReminderStrategy;

  const mockPrisma = {
    schedule: { findUnique: jest.fn() },
    user: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketReminderStrategy,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    strategy = module.get(TicketReminderStrategy);
    jest.clearAllMocks();
  });

  const cases: Array<{ type: NotificationType; expectTitleIncludes: string }> =
    [
      {
        type: NotificationType.PRE_TICKETING_OPEN,
        expectTitleIncludes: '선예매 오픈',
      },
      {
        type: NotificationType.GENERAL_TICKETING_OPEN,
        expectTitleIncludes: '일반 예매 오픈',
      },
      {
        type: NotificationType.PRE_TICKETING_1D,
        expectTitleIncludes: '선예매 1일전',
      },
      {
        type: NotificationType.GENERAL_TICKETING_1D,
        expectTitleIncludes: '일반 예매 1일전',
      },
      {
        type: NotificationType.PRE_TICKETING_30MIN,
        expectTitleIncludes: '선예매 30분전',
      },
      {
        type: NotificationType.GENERAL_TICKETING_30MIN,
        expectTitleIncludes: '일반 예매 30분전',
      },
    ];

  it.each(cases)(
    '$type 은 알맞은 제목/내용을 만든다',
    async ({ type, expectTitleIncludes }) => {
      const message = await strategy.buildMessage({
        notificationType: type,
        concertTitle: '테스트콘서트',
        timeStr: '오후 8시',
      });

      expect(message.title).toContain(expectTitleIncludes);
      expect(message.content).toContain('테스트콘서트');
    },
  );

  it('concertTitle 이 없으면 기본값 "콘서트" 로 대체된다', async () => {
    const message = await strategy.buildMessage({
      notificationType: NotificationType.PRE_TICKETING_OPEN,
    });

    expect(message.content).toContain('콘서트');
  });

  it('지원하지 않는 notificationType 이면 Error 를 던진다', async () => {
    await expect(
      strategy.buildMessage({
        concertTitle: '기본',
      }),
    ).rejects.toThrow(/Unsupported notificationType/);
  });
});
