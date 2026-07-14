import { ScheduleType } from '@prisma/client';

export class CalendarEventDto {
  id: number;
  artist: string;
  type: ScheduleType;
}

export class CalendarDayDto {
  date: string;
  events: CalendarEventDto[];
}

export class MonthlyCalendarResponseDto {
  year: number;
  month: number;
  days: CalendarDayDto[];
}
