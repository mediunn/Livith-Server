import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConcertStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ConcertSchedulerService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('5 0 * * *') // 매일 00시 05분 실행
  async handleSortedIndexUpdate() {
    // 1. 기존의 sortedIndex 값 모두 초기화
    await this.prisma.concert.updateMany({
      data: { sortedIndex: null }, // 또는 sortedIndex: 0 으로 초기화 가능
    });

    // 2. 모든 concert 데이터를 상태별로 필터링 및 정렬
    const allConcerts = await this.prisma.concert.findMany();

    const ongoing = allConcerts
      .filter((c) => c.status === ConcertStatus.ONGOING) // 예시로 status 필드 값 사용
      .sort((a, b) => a.title.localeCompare(b.title)); // 정렬 기준 설정

    const upcoming = allConcerts
      .filter((c) => c.status === ConcertStatus.UPCOMING)
      .sort((a, b) =>
        a.startDate < b.startDate
          ? -1
          : a.startDate > b.startDate
            ? 1
            : a.title.localeCompare(b.title),
      );

    const completed = allConcerts
      .filter((c) => c.status === ConcertStatus.COMPLETED)
      .sort((a, b) =>
        a.startDate > b.startDate
          ? -1
          : a.startDate < b.startDate
            ? 1
            : a.title.localeCompare(b.title),
      );

    const sorted = [...ongoing, ...upcoming, ...completed];

    // 3. 새로운 sortedIndex 값으로 업데이트
    const updatePromises = sorted.map((concert, index) =>
      this.prisma.concert.update({
        where: { id: concert.id },
        data: { sortedIndex: index + 1 },
      }),
    );

    // 모든 업데이트를 병렬로 실행
    await Promise.all(updatePromises);
  }
}
