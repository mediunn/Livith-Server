import { ConcertStatus, ScheduleType } from '@prisma/client';

export class DailyEventDto {
  id: number;
  title: string | null;
  type: ScheduleType;
  status: ConcertStatus;
  time: string | null;
  detail: string | null;
}

export class DailyEventsResponseDto {
  date: string;
  events: DailyEventDto[];
}
