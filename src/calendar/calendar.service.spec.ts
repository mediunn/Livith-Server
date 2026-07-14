import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';

import { CalendarService } from './calendar.service';
import { RequestScheduleType } from './enum/request-schedule-type.enum';
import { ConcertType } from './enum/concert-type.enum';

describe('CalendarService', () => {
  let service: CalendarService;

  let mockPrismaService: {
    schedule: {
      findMany: jest.Mock;
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

    service = module.get(CalendarService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlyCalendar', () => {
    it('ALL 조회는 로그인 없이도 동작해야 함', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([
        {
          type: 'CONCERT',
          scheduledAt: new Date('2026-05-01T00:00:00.000Z'),
          concert: {
            id: 10,
            artist: '아티스트A',
          },
        },
      ]);

      const result = await service.getMonthlyCalendar(
        2026,
        5,
        [RequestScheduleType.CONCERT],
        ConcertType.ALL,
      );

      expect(mockUserService.validateUser).not.toHaveBeenCalled();

      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        where: {
          type: {
            in: ['CONCERT'],
          },
          scheduledAt: {
            gte: new Date('2026-05-01T00:00:00.000Z'),
            lt: new Date('2026-06-01T00:00:00.000Z'),
          },
        },
        select: {
          type: true,
          scheduledAt: true,
          concert: {
            select: {
              id: true,
              artist: true,
            },
          },
        },
        orderBy: [
          { scheduledAt: 'asc' },
          { concert: { title: 'asc' } },
          { id: 'asc' },
        ],
      });

      expect(result).toEqual({
        year: 2026,
        month: 5,
        days: [
          {
            date: '2026-05-01',
            events: [
              {
                id: 10,
                artist: '아티스트A',
                type: 'CONCERT',
              },
            ],
          },
        ],
      });
    });

    it('INTEREST 조회는 userId 없으면 401을 던져야 함', async () => {
      await expect(
        service.getMonthlyCalendar(
          2026,
          5,
          [RequestScheduleType.TICKETING],
          ConcertType.INTEREST,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUserService.validateUser).not.toHaveBeenCalled();
      expect(mockPrismaService.schedule.findMany).not.toHaveBeenCalled();
    });

    it('INTEREST 조회는 validateUser를 호출해야 함', async () => {
      mockUserService.validateUser.mockResolvedValue({});

      mockPrismaService.schedule.findMany.mockResolvedValue([]);

      await service.getMonthlyCalendar(
        2026,
        5,
        [RequestScheduleType.TICKETING],
        ConcertType.INTEREST,
        7,
      );

      expect(mockUserService.validateUser).toHaveBeenCalledWith(7);

      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        where: {
          type: {
            in: ['PRE_TICKETING', 'GENERAL_TICKETING', 'ADD_TICKETING'],
          },
          scheduledAt: {
            gte: new Date('2026-05-01T00:00:00.000Z'),
            lt: new Date('2026-06-01T00:00:00.000Z'),
          },
          concert: {
            userInterestConcerts: {
              some: {
                userId: 7,
              },
            },
          },
        },
        select: {
          type: true,
          scheduledAt: true,
          concert: {
            select: {
              id: true,
              artist: true,
            },
          },
        },
        orderBy: [
          { scheduledAt: 'asc' },
          { concert: { title: 'asc' } },
          { id: 'asc' },
        ],
      });
    });
  });
});
