import { RequestScheduleType } from '../enum/request-schedule-type.enum';

export class CalendarEventDto {
  id: number;
  artist: string;
  type: RequestScheduleType;
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
