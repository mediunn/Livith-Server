import { Schedule, ScheduleType } from '@prisma/client';

export class ScheduleResponseDto {
  id: number;
  category: string;
  scheduledAt: Date;
  type: ScheduleType;

  constructor(schedule: Schedule) {
    this.id = schedule.id;
    this.category = schedule.category;
    this.scheduledAt = schedule.scheduledAt;
    this.type = schedule.type;
  }
}
