import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConcertStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ConcertSchedulerService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // 매일 0시 실행
  async handleSortedIndexUpdate() {
    const allConcerts = await this.prisma.concert.findMany();

    const ongoing = allConcerts
      .filter((c) => c.status === ConcertStatus.ONGOING)
      .sort((a, b) => a.title.localeCompare(b.title));

    const upcoming = allConcerts
      .filter((c) => c.status === ConcertStatus.UPCOMING)
      .sort((a, b) => {
        if (a.startDate < b.startDate) return -1;
        if (a.startDate > b.startDate) return 1;
        return a.title.localeCompare(b.title);
      });

    const completed = allConcerts
      .filter((c) => c.status === ConcertStatus.COMPLETED)
      .sort((a, b) => {
        if (a.startDate > b.startDate) return -1;
        if (a.startDate < b.startDate) return 1;
        return a.title.localeCompare(b.title);
      });

    const sorted = [...ongoing, ...upcoming, ...completed];

    for (let i = 0; i < sorted.length; i++) {
      await this.prisma.concert.update({
        where: { id: sorted[i].id },
        data: { sortedIndex: i },
      });
    }
  }
}
