import { RequestScheduleType } from '../enum/request-schedule-type.enum';

export class CalendarEventDto {
  id: number;
  artist: string;
  type: RequestScheduleType;
}

export class MonthlyCalendarResponseDto {
  date: string;
  events: CalendarEventDto[];
}
