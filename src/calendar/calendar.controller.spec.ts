import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { RequestScheduleType } from './enum/request-schedule-type.enum';
import { ConcertType } from './enum/concert-type.enum';

type CalendarServiceMock = {
  getMonthlyCalendar: jest.MockedFunction<
    CalendarService['getMonthlyCalendar']
  >;
};

describe('CalendarController', () => {
  let controller: CalendarController;
  let mockCalendarService: CalendarServiceMock;

  beforeEach(async () => {
    mockCalendarService = {
      getMonthlyCalendar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMonthlyCalendar를 서비스에 그대로 위임해야 함', async () => {
    const query = {
      year: 2026,
      month: 5,
      scheduleTypes: [
        RequestScheduleType.CONCERT,
        RequestScheduleType.TICKETING,
      ],
      concertType: ConcertType.ALL,
    };
    const user = { userId: 7 };
    const response = {
      year: 2026,
      month: 5,
      days: [],
    };

    mockCalendarService.getMonthlyCalendar.mockResolvedValue(response);

    await expect(
      controller.getMonthlyCalendar(query as any, user),
    ).resolves.toBe(response);

    expect(mockCalendarService.getMonthlyCalendar).toHaveBeenCalledWith(
      2026,
      5,
      [RequestScheduleType.CONCERT, RequestScheduleType.TICKETING],
      ConcertType.ALL,
      7,
    );
  });
});
