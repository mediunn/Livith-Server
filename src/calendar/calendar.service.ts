import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import {
  ConcertStatus,
  ScheduleType as PrismaScheduleType,
} from '@prisma/client';

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
  private hasTime(type: PrismaScheduleType, date: Date): boolean {
    // 공연 일정은 00:00이면 시간 미정으로 판단
    if (type === PrismaScheduleType.CONCERT) {
      return !(
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0
      );
    }

    // 티켓팅 일정은 시간이 항상 존재한다고 판단
    return true;
  }
  /**
   * 캘린더 일정 정렬
   *
   * 1. 취소 공연 최하단
   * 2. 시간 있는 일정 우선
   * 3. 시간순
   * 4. 공연명 가나다순
   */
  private sortSchedules<
    T extends {
      type: PrismaScheduleType;
      scheduledAt: Date;
      concert: {
        title: string | null;
        status: ConcertStatus;
      };
    },
  >(schedules: T[]) {
    return schedules.sort((a, b) => {
      // 취소 공연 최하단
      const aCanceled = a.concert.status === ConcertStatus.CANCELED;
      const bCanceled = b.concert.status === ConcertStatus.CANCELED;

      if (aCanceled && !bCanceled) {
        return 1;
      }

      if (!aCanceled && bCanceled) {
        return -1;
      }
      const aHasTime = this.hasTime(a.type, a.scheduledAt);

      const bHasTime = this.hasTime(b.type, b.scheduledAt);
      // 시간 없는 일정은 하단
      if (!aHasTime && bHasTime) {
        return 1;
      }

      if (aHasTime && !bHasTime) {
        return -1;
      }

      // 시간 있는 일정끼리 시간순
      if (aHasTime && bHasTime) {
        const timeCompare = a.scheduledAt.getTime() - b.scheduledAt.getTime();

        if (timeCompare !== 0) {
          return timeCompare;
        }
      }

      // 공연명 가나다순
      return (a.concert.title ?? '').localeCompare(b.concert.title ?? '', 'ko');
    });
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

    let schedules = await this.prismaService.schedule.findMany({
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
            title: true,
            status: true,
          },
        },
      },
    });

    schedules = this.sortSchedules(schedules);

    const days = new Map<
      string,
      {
        date: string;
        events: Array<{
          id: number;
          artist: string;
          type: RequestScheduleType;
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

      const events = days.get(date)!.events;

      // 월별 캘린더는 하루 최대 3개까지만 표시
      if (events.length < 3) {
        events.push({
          id: schedule.concert.id,
          artist: schedule.concert.artist,
          type:
            schedule.type === PrismaScheduleType.CONCERT
              ? RequestScheduleType.CONCERT
              : RequestScheduleType.TICKETING,
        });
      }
    }

    return {
      year,
      month,
      days: Array.from(days.values()),
    };
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

    let schedules = await this.prismaService.schedule.findMany({
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
    });

    schedules = this.sortSchedules(schedules);

    const events = schedules.map((schedule) => {
      const isConcert = schedule.type === PrismaScheduleType.CONCERT;

      const hasTime = this.hasTime(schedule.type, schedule.scheduledAt);
      return {
        id: schedule.concert.id,
        title: schedule.concert.title ?? '',
        type: schedule.type,
        status: schedule.concert.status,

        time: hasTime
          ? schedule.scheduledAt.toISOString().substring(11, 16)
          : null,

        detail: isConcert
          ? schedule.concert.venue
          : schedule.concert.ticketSite,
      };
    });

    return {
      date,
      events,
    };
  }
}
