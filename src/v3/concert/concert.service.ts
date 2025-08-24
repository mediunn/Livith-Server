import { Injectable } from '@nestjs/common';
import { ConcertFilter } from '../common/enums/concert-filter.enum';
import { ConcertStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertResponseDto } from './dto/concert-response.dto';
import { getDaysUntil } from '../common/utils/date.util';

@Injectable()
export class ConcertService {
  constructor(private readonly prismaService: PrismaService) {}
  // 콘서트 목록 조회
  async getConcerts(filter: ConcertFilter, cursor?: number, size?: number) {
    let where = {};
    let cursorObj: { id: number } | { sortedIndex: number } | undefined =
      undefined;
    let orderBy: { [key: string]: 'asc' | 'desc' }[] = [];

    switch (filter) {
      case ConcertFilter.NEW:
        // 한달 이내 최신 등록된 콘서트
        where = {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)), // 한 달 전 날짜부터
          },
        };
        orderBy = [{ id: 'desc' }]; // id 기준 내림차순 정렬 (최신 등록 순)
        if (cursor !== undefined) {
          cursorObj = { id: cursor };
        }
        break;

      case ConcertFilter.UPCOMING:
        where = {
          status: ConcertStatus.UPCOMING,
        };
        orderBy = [{ sortedIndex: 'asc' }];
        if (cursor !== undefined) {
          cursorObj = { sortedIndex: cursor };
        }
        break;

      case ConcertFilter.ALL:
        orderBy = [{ sortedIndex: 'asc' }];
        if (cursor !== undefined) {
          cursorObj = { sortedIndex: cursor };
        }
        break;

      default:
        throw new Error(`Unsupported filter: ${filter}`);
    }

    const concerts = await this.prismaService.concert.findMany({
      where,
      orderBy,
      cursor: cursorObj,
      take: size,
      skip: cursor ? 1 : 0,
    });

    const concertResponse = concerts.map(
      (concert) =>
        new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
    );

    const nextCursor =
      concerts.length > 0
        ? filter === ConcertFilter.NEW
          ? concerts[concerts.length - 1].id
          : concerts[concerts.length - 1].sortedIndex
        : null;

    return {
      data: concertResponse,
      cursor: nextCursor,
    };
  }
}
