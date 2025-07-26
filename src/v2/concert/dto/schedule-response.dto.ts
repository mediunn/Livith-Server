import { Schedule } from '@prisma/client';

export class ScheduleResponseDto {
  id: number;
  category: string;
  scheduledAt: Date;

  constructor(schedule: Schedule) {
    this.id = schedule.id;
    this.category = schedule.category;
    this.scheduledAt = schedule.scheduledAt;
  }
}
