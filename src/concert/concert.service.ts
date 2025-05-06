import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';
import { getDaysUntil } from 'src/common/utils/date.util';
import { ConcertResponseDto } from './dto/concert-response.dto';
import { CultureResponseDto } from './dto/culture-response.dto';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConcertService {
  constructor(private readonly prismaService: PrismaService) {}
  // 콘서트 목록 조회
  async getConcerts(status: ConcertStatus, cursor?: number, size?: number) {
    const today = dayjs().format('YYYY.MM.DD');
    const oneMonthAgo = dayjs().subtract(1, 'month').format('YYYY.MM.DD');

    const statusCondition: Prisma.ConcertWhereInput = {
      status: status,
    };

    // 완료된 콘서트는 1개월 전까지 조회 가능
    if (status === ConcertStatus.COMPLETED) {
      statusCondition.startDate = {
        gte: oneMonthAgo,
        lt: today,
      };
    }

    const concertLists = await this.prismaService.concert.findMany({
      where: statusCondition,
      take: size,
      cursor: cursor ? { sortedIndex: cursor } : undefined,
      orderBy: { sortedIndex: 'asc' },
    });

    const concertResponse = concertLists.map(
      (concert) =>
        new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
    );
    // **다음 페이지의 cursor 값은 마지막 아이템의 sortedIndex보다 1 증가한 값**
    const nextCursor =
      concertLists.length > 0
        ? concertLists[concertLists.length - 1].sortedIndex + 1
        : null;
    // daysLeft 계산
    return {
      data: concertResponse,
      cursor: nextCursor,
    };
  }

  // 콘서트 상세 조회
  async getConcertDetails(id: number) {
    const concert = await this.prismaService.concert.findUnique({
      where: {
        id: id,
      },
    });

    // 콘서트가 없을 경우 예외 처리
    if (!concert) {
      throw new NotFoundException(`해당 콘서트를 찾을 수 없습니다.`);
    }

    return new ConcertResponseDto(concert, getDaysUntil(concert.startDate));
  }

  // 콘서트에 해당하는 문화 조회
  async getConcertCulture(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    // 문화 조회
    const cultures = await this.prismaService.culture.findMany({
      where: {
        concertId: id,
      },
    });

    return cultures.map((culture) => new CultureResponseDto(culture));
  }
}
