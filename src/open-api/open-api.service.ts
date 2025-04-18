import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import dayjs from 'dayjs';
import { FetchConcertService } from './fetch-concert.service';
import { getDaysUntil } from 'src/common/utils/date.util';
import { mapStatusToEnum } from 'src/common/utils/concert.util';

@Injectable()
export class OpenApiService {
  constructor(
    private readonly fetchConcertService: FetchConcertService,
    private readonly prismaService: PrismaService,
  ) {}

  //매 3일마다 오전 3시에 실행
  @Cron('0 0 3 */3 * *')
  async handleDailyUpdate() {
    await this.fetchAndSaveConcerts();
  }

  async fetchAndSaveConcerts() {
    const today = dayjs().format('YYYYMMDD');
    const yesterday = dayjs().subtract(1, 'day').format('YYYYMMDD');
    const oneMonthAgo = dayjs()
      .subtract(1, 'month')
      .subtract(1, 'day')
      .format('YYYYMMDD');
    // 공연 중
    const ongoingCodes = await this.fetchConcertService.fetchConcertsInRange(
      today,
      today,
      '02',
    );

    // 공연 완료 (어제~한 달 전)
    const completedCodes = await this.fetchConcertService.fetchConcertsInRange(
      oneMonthAgo,
      yesterday,
      '03',
    );

    // 공연 예정 (내일부터 3달치)
    const futureCodes = [];
    const start = dayjs().add(1, 'day');
    for (let i = 0; i < 3; i++) {
      const startDate = start.add(i, 'month').format('YYYYMMDD');
      const endDate = start
        .add(i + 1, 'month')
        .subtract(1, 'day')
        .format('YYYYMMDD');
      const futureConcerts =
        await this.fetchConcertService.fetchConcertsInRange(
          startDate,
          endDate,
          '01',
        );
      futureCodes.push(...futureConcerts);
    }

    // 각각 정렬
    const ongoingDetails = (
      await this.fetchConcertService.fetchConcertDetails(ongoingCodes)
    ).sort((a, b) => a.title.localeCompare(b.title));

    const completedDetails = (
      await this.fetchConcertService.fetchConcertDetails(completedCodes)
    ).sort((a, b) => {
      if (a.startDate < b.startDate) return -1;
      if (a.startDate > b.startDate) return 1;
      return a.title.localeCompare(b.title);
    });

    const futureDetails = (
      await this.fetchConcertService.fetchConcertDetails(futureCodes)
    ).sort((a, b) => {
      if (a.startDate < b.startDate) return -1;
      if (a.startDate > b.startDate) return 1;
      return a.title.localeCompare(b.title);
    });

    const allConcerts = [
      ...ongoingDetails,
      ...completedDetails,
      ...futureDetails,
    ];

    // 프리즈마에 저장
    for (const concert of allConcerts) {
      await this.prismaService.concert.upsert({
        where: { code: concert.code },
        update: {
          title: concert.title,
          startDate: concert.startDate,
          endDate: concert.endDate,
          artist: concert.artist,
          poster: concert.poster,
          status: mapStatusToEnum(concert.status),
          daysLeft: getDaysUntil(concert.startDate),
        },
        create: {
          code: concert.code,
          title: concert.title,
          startDate: concert.startDate,
          endDate: concert.endDate,
          artist: concert.artist,
          poster: concert.poster,
          status: mapStatusToEnum(concert.status),
          daysLeft: getDaysUntil(concert.startDate),
        },
      });
    }
  }
}
