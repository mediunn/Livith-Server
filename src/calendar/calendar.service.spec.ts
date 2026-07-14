import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { PrismaService } from 'prisma/prisma.service';
import { CalendarService } from './calendar.service';
import { UserService } from 'src/user/user.service';

import {
  ConcertStatus,
  ScheduleType as PrismaScheduleType,
} from '@prisma/client';

import { RequestScheduleType } from './enum/request-schedule-type.enum';
import { ConcertType } from './enum/concert-type.enum';

import { UnauthorizedException } from '@nestjs/common';

describe('CalendarService', () => {
  let service: CalendarService;

  let mockPrismaService: {
    schedule: {
      findMany: jest.MockedFunction<any>;
    };
  };

  let mockUserService: {
    validateUser: jest.Mock;
  };

  beforeEach(async () => {
    mockPrismaService = {
      schedule: {
        findMany: jest.fn(),
      },
    };

    mockUserService = {
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlyCalendar', () => {
    it('전체 공연 조회 성공', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T19:00:00.000Z'),
          concert: {
            id: 1,
            artist: '아이유',
            title: '콘서트',
            status: ConcertStatus.ONGOING,
          },
        },
      ]);

      const result = await service.getMonthlyCalendar(
        2026,
        5,
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(result).toEqual({
        year: 2026,
        month: 5,
        days: [
          {
            date: '2026-05-01',
            events: [
              {
                id: 1,
                artist: '아이유',
                type: PrismaScheduleType.CONCERT,
              },
            ],
          },
        ],
      });
    });

    it('INTEREST 조회 시 userId 없으면 401', async () => {
      await expect(
        service.getMonthlyCalendar(
          2026,
          5,
          [RequestScheduleType.CONCERT],
          ConcertType.INTEREST,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.schedule.findMany).not.toHaveBeenCalled();
    });

    it('시간 없는 공연보다 시간 있는 공연이 먼저 정렬된다', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T00:00:00.000Z'),
          concert: {
            id: 1,
            artist: 'A',
            title: '시간없음',
            status: ConcertStatus.ONGOING,
          },
        },
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T18:00:00.000Z'),
          concert: {
            id: 2,
            artist: 'B',
            title: '시간있음',
            status: ConcertStatus.ONGOING,
          },
        },
      ]);

      const result = await service.getMonthlyCalendar(
        2026,
        5,
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(result.days[0].events[0].id).toBe(2);
    });

    it('취소 공연은 가장 마지막 정렬된다', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T10:00:00.000Z'),
          concert: {
            id: 1,
            artist: '취소',
            title: '취소 공연',
            status: ConcertStatus.CANCELED,
          },
        },
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T20:00:00.000Z'),
          concert: {
            id: 2,
            artist: '정상',
            title: '정상 공연',
            status: ConcertStatus.ONGOING,
          },
        },
      ]);

      const result = await service.getMonthlyCalendar(
        2026,
        5,
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(result.days[0].events[1].id).toBe(1);
    });

    it('시간이 동일하면 공연명 가나다순으로 정렬된다', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T18:00:00.000Z'),
          concert: {
            id: 1,
            artist: '지코',
            title: '지코',
            status: ConcertStatus.ONGOING,
          },
        },
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T18:00:00.000Z'),
          concert: {
            id: 2,
            artist: '아이유',
            title: '아이유',
            status: ConcertStatus.ONGOING,
          },
        },
      ]);

      const result = await service.getMonthlyCalendar(
        2026,
        5,
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(result.days[0].events[0].id).toBe(2);

      expect(result.days[0].events[1].id).toBe(1);
    });

    it('월별 캘린더는 하루 최대 3개까지만 반환한다', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T10:00:00.000Z'),
          concert: {
            id: 1,
            artist: 'A',
            title: '공연1',
            status: ConcertStatus.ONGOING,
          },
        },
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T11:00:00.000Z'),
          concert: {
            id: 2,
            artist: 'B',
            title: '공연2',
            status: ConcertStatus.ONGOING,
          },
        },
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T12:00:00.000Z'),
          concert: {
            id: 3,
            artist: 'C',
            title: '공연3',
            status: ConcertStatus.ONGOING,
          },
        },
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-05-01T13:00:00.000Z'),
          concert: {
            id: 4,
            artist: 'D',
            title: '공연4',
            status: ConcertStatus.ONGOING,
          },
        },
      ]);

      const result = await service.getMonthlyCalendar(
        2026,
        5,
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(result.days[0].events).toHaveLength(3);

      expect(result.days[0].events.map((e) => e.id)).toEqual([1, 2, 3]);
    });
  });

  describe('getEventsByDate', () => {
    it('날짜별 일정 조회 성공', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-07-13T19:30:00.000Z'),
          concert: {
            id: 10,
            title: '공연A',
            status: ConcertStatus.ONGOING,
            venue: '잠실',
            ticketSite: null,
          },
        },
      ]);

      const result = await service.getEventsByDate(
        '2026-07-13',
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(result.events[0]).toEqual({
        id: 10,
        title: '공연A',
        type: PrismaScheduleType.CONCERT,
        status: ConcertStatus.ONGOING,
        time: '19:30',
        detail: '잠실',
      });
    });

    it('시간 없는 일정은 time이 null이다', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: PrismaScheduleType.CONCERT,
          scheduledAt: new Date('2026-07-13T00:00:00.000Z'),
          concert: {
            id: 1,
            title: '시간미정 공연',
            status: ConcertStatus.ONGOING,
            venue: '서울',
            ticketSite: null,
          },
        },
      ]);

      const result = await service.getEventsByDate(
        '2026-07-13',
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(result.events[0].time).toBeNull();
    });
  });
});
