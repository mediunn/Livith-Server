import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertFilter } from '../common/enums/concert-filter.enum';
import { ConcertStatus } from '../common/enums/concert-status.enum';
import { getDaysUntil } from '../common/utils/date.util';
import { ConcertResponseDto } from './dto/concert-response.dto';
import { ArtistResponseDto } from './dto/artist-response.dto';
import { CultureResponseDto } from './dto/culture-response.dto';
import { MDResponseDto } from './dto/md-response.dto';
import { ConcertInfoResponseDto } from './dto/concert-info-response.dto';
import { ScheduleResponseDto } from 'src/v1/concert/dto/schedule-response.dto';

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

  // 콘서트의 아티스트 정보 조회
  async getConcertArtist(id: number) {
    const artistId = await this.prismaService.concert.findUnique({
      where: {
        id: id,
      },
      select: {
        artistId: true,
      },
    });

    // 콘서트가 없을 경우 예외 처리
    if (!artistId) {
      throw new NotFoundException(`해당 콘서트를 찾을 수 없습니다.`);
    }

    // 아티스트 정보 조회
    const artist = await this.prismaService.artist.findUnique({
      where: {
        id: artistId.artistId,
      },
    });

    // 아티스트가 없을 경우 예외 처리
    if (!artist) {
      throw new NotFoundException(`해당 아티스트를 찾을 수 없습니다.`);
    }

    return new ArtistResponseDto(artist);
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

  // 콘서트에 해당하는 MD 목록 조회
  async getConcertMds(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    // MD 조회
    const mds = await this.prismaService.md.findMany({
      where: {
        concertId: id,
      },
    });

    return mds.map((md) => new MDResponseDto(md));
  }

  // 콘서트의 필수 정보 목록 조회
  async getConcertInfos(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    const concertInfos = await this.prismaService.concertInfo.findMany({
      where: {
        concertId: id,
      },
    });

    return concertInfos.map((info) => new ConcertInfoResponseDto(info));
  }

  // 콘서트 일정 목록 조회
  async getConcertSchedule(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    const schedules = await this.prismaService.schedule.findMany({
      where: {
        concertId: id,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return schedules.map((schedule) => new ScheduleResponseDto(schedule));
  }
}
