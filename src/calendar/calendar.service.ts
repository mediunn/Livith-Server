import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { ScheduleType as PrismaScheduleType } from '@prisma/client';

import { DailyEventsResponseDto } from './dto/daily-events-response.dto';
import { MonthlyCalendarResponseDto } from './dto/monthly-calendar-response.dto';
import { ConcertType } from './enum/concert-type.enum';
import { RequestScheduleType } from './enum/request-schedule-type.enum';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  private getPrismaScheduleTypes(
    scheduleTypes: RequestScheduleType[],
  ): PrismaScheduleType[] {
    return scheduleTypes.flatMap((scheduleType) =>
      scheduleType === RequestScheduleType.CONCERT
        ? [PrismaScheduleType.CONCERT]
        : [
            PrismaScheduleType.PRE_TICKETING,
            PrismaScheduleType.GENERAL_TICKETING,
            PrismaScheduleType.ADD_TICKETING,
          ],
    );
  }

  // 월별 캘린더 조회
  async getMonthlyCalendar(
    year: number,
    month: number,
    scheduleTypes: RequestScheduleType[],
    concertType: ConcertType,
    userId?: number,
  ): Promise<MonthlyCalendarResponseDto> {
    if (concertType === ConcertType.INTEREST) {
      if (!userId) {
        throw new UnauthorizedException();
      }

      await this.userService.validateUser(userId);
    }

    const prismaScheduleTypes = this.getPrismaScheduleTypes(scheduleTypes);

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const schedules = await this.prismaService.schedule.findMany({
      where: {
        type: {
          in: prismaScheduleTypes,
        },
        scheduledAt: {
          gte: start,
          lt: end,
        },
        ...(concertType === ConcertType.INTEREST && userId
          ? {
              concert: {
                userInterestConcerts: {
                  some: {
                    userId,
                  },
                },
              },
            }
          : {}),
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

    const days = new Map<
      string,
      {
        date: string;
        events: Array<{
          id: number;
          artist: string;
          type: PrismaScheduleType;
        }>;
      }
    >();

    for (const schedule of schedules) {
      const date = schedule.scheduledAt.toISOString().slice(0, 10);

      if (!days.has(date)) {
        days.set(date, {
          date,
          events: [],
        });
      }

      days.get(date)!.events.push({
        id: schedule.concert.id,
        artist: schedule.concert.artist,
        type: schedule.type!,
      });
    }

    return {
      year,
      month,
      days: Array.from(days.values()),
    } satisfies MonthlyCalendarResponseDto;
  }

  // 날짜별 일정 조회
  async getEventsByDate(
    date: string,
    scheduleTypes: RequestScheduleType[],
    concertType: ConcertType,
    userId?: number,
  ): Promise<DailyEventsResponseDto> {
    if (concertType === ConcertType.INTEREST) {
      if (!userId) {
        throw new UnauthorizedException();
      }

      await this.userService.validateUser(userId);
    }

    const prismaScheduleTypes = this.getPrismaScheduleTypes(scheduleTypes);

    const [year, month, day] = date.split('-').map(Number);

    const start = new Date(Date.UTC(year, month - 1, day));
    const end = new Date(Date.UTC(year, month - 1, day + 1));

    const schedules = await this.prismaService.schedule.findMany({
      where: {
        type: {
          in: prismaScheduleTypes,
        },
        scheduledAt: {
          gte: start,
          lt: end,
        },
        ...(concertType === ConcertType.INTEREST && userId
          ? {
              concert: {
                userInterestConcerts: {
                  some: {
                    userId,
                  },
                },
              },
            }
          : {}),
      },
      select: {
        type: true,
        scheduledAt: true,
        concert: {
          select: {
            id: true,
            title: true,
            status: true,
            venue: true,
            ticketSite: true,
          },
        },
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { concert: { title: 'asc' } },
        { id: 'asc' },
      ],
    });

    const events = schedules.map((schedule) => {
      const isConcert = schedule.type === PrismaScheduleType.CONCERT;

      return {
        id: schedule.concert.id,
        title: schedule.concert.title ?? '',
        type: schedule.type!,
        status: schedule.concert.status,
        time: schedule.scheduledAt.toISOString().substring(11, 16),
        detail: isConcert
          ? schedule.concert.venue
          : schedule.concert.ticketSite,
      };
    });

    return {
      date,
      events,
    } satisfies DailyEventsResponseDto;
  }
}
