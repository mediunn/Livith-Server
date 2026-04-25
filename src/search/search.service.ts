import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { BannerResponseDto } from './dto/banner-response.dto';
import { SearchSectionResponseDto } from './dto/search-section-response.dto';
import { ConcertSort } from '../common/enums/concert-sort.enum';
import { ConcertGenre } from '../common/enums/concert-genre.enum';
import { ConcertStatus } from '../common/enums/concert-status.enum';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getConcertDaysLeft } from '../common/utils/date.util';
import { GenreType, Prisma } from '@prisma/client';
import { GetConcertSearchResultsDto } from './dto/get-concert-search-results.dto';
import { NotFoundException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { RepresentativeArtistResponseDto } from './dto/representative-artist-response.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prismaService: PrismaService) {}

  // 배너 조회
  async getBanners() {
    const banners = await this.prismaService.banner.findMany({
      take: 5,
    });
    return banners.map((banner) => new BannerResponseDto(banner));
  }

  //추천 검색어 조회
  async getRecommendWords(letter: string) {
    const recommendWords = await this.prismaService.concert.findMany({
      where: {
        OR: [{ title: { contains: letter } }, { artist: { contains: letter } }],
        NOT: {
          status: ConcertStatus.CANCELED,
        },
      },
      take: 10,
    });

    // title이나 artist에 포함된 값만 필터링
    const filteredResults = recommendWords.map((concert) => {
      const lowerLetter = letter.toLowerCase();

      // title에 포함된 경우
      if (concert.title.toLowerCase().includes(lowerLetter)) {
        return concert.title;
      }

      // artist에 포함된 경우
      if (concert.artist.toLowerCase().includes(lowerLetter)) {
        return concert.artist;
      }
    });

    return filteredResults;
  }

  // 탐색 화면 섹션 정보 조회
  async getSearchSections() {
    const sections = await this.prismaService.searchSection.findMany({
      include: {
        searchConcertSections: {
          orderBy: {
            sortedIndex: 'asc',
          },
          include: {
            concert: true,
          },
        },
      },
    });
    return sections.map((section) => new SearchSectionResponseDto(section));
  }

  //필터에 따른 검색 결과 콘서트 목록 조회
  async getConcertSearchResults(query: GetConcertSearchResultsDto) {
    const { genre, status, sort, keyword, cursor, size = 20 } = query;

    const hasAll = status?.includes(ConcertStatus.ALL) ?? false;

    // 1. cursor 콘서트 조회 (status까지 가져와서 phase 판단에 사용)
    const cursorConcert = cursor
      ? await this.prismaService.concert.findUnique({
          where: { id: cursor },
          select: { id: true, startDate: true, title: true, status: true },
        })
      : null;
    if (cursor && !cursorConcert) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    // 2. 선택 상태 분류 (CANCELED는 항상 뒤로 보내야 하므로 분리)
    const explicitStatuses =
      status && !hasAll ? status.filter((s) => s !== ConcertStatus.ALL) : null;
    const wantsCancelled = explicitStatuses
      ? explicitStatuses.includes(ConcertStatus.CANCELED)
      : false;
    const nonCancelledStatuses = explicitStatuses
      ? explicitStatuses.filter((s) => s !== ConcertStatus.CANCELED)
      : null;
    const wantsNonCancelled =
      nonCancelledStatuses === null || nonCancelledStatuses.length > 0;

    // 3. 정렬 조건
    const orderBy =
      sort === ConcertSort.ALPHABETICAL
        ? [{ title: 'asc' as const }, { id: 'asc' as const }]
        : [{ startDate: 'asc' as const }, { id: 'asc' as const }];

    const buildCursorObj = (c: typeof cursorConcert) =>
      sort === ConcertSort.ALPHABETICAL
        ? { title_id: { title: c.title, id: c.id } }
        : { startDate_id: { startDate: c.startDate, id: c.id } };

    // 4. 공통 필터 (장르 + 키워드)
    const baseAnd: Prisma.ConcertWhereInput[] = [];
    if (genre && !genre.includes(ConcertGenre.ALL)) {
      const prismaGenres = genre.map(
        (g) => GenreType[g as keyof typeof GenreType],
      );
      baseAnd.push({
        concertGenre: { some: { genre: { name: { in: prismaGenres } } } },
      });
    }
    if (keyword) {
      baseAnd.push({
        OR: [
          { title: { contains: keyword } },
          { artist: { contains: keyword } },
        ],
      });
    }

    // 5. Phase 결정: cursor가 CANCELED면 phase 2부터, 아니면 phase 1부터
    const inPhase2 = cursorConcert?.status === ConcertStatus.CANCELED;

    // 6. count용 status 조건
    const countStatusCondition: Prisma.ConcertWhereInput = explicitStatuses
      ? {
          status: {
            in: explicitStatuses as Prisma.EnumConcertStatusFilter['in'],
          },
        }
      : {
          status: {
            not: ConcertStatus.CANCELED as Prisma.ConcertWhereInput['status'],
          },
        };

    // 7. 단일 트랜잭션 안에서 phase 1 → phase 2 → count 순차 실행 (스냅샷 일관성 보장)
    const { merged, totalCount } = await this.prismaService.$transaction(
      async (tx) => {
        // Phase 1: non-CANCELED
        let phase1: Awaited<ReturnType<typeof tx.concert.findMany>> = [];
        if (wantsNonCancelled && !inPhase2) {
          const phase1Status: Prisma.EnumConcertStatusFilter =
            nonCancelledStatuses
              ? {
                  in: nonCancelledStatuses as Prisma.EnumConcertStatusFilter['in'],
                }
              : {
                  not: ConcertStatus.CANCELED as Prisma.EnumConcertStatusFilter['not'],
                };
          phase1 = await tx.concert.findMany({
            where: { AND: [...baseAnd, { status: phase1Status }] },
            orderBy,
            cursor: cursorConcert ? buildCursorObj(cursorConcert) : undefined,
            skip: cursorConcert ? 1 : 0,
            take: size,
          });
        }

        // Phase 2: CANCELED (남은 자리만큼만 채움)
        const remaining = size - phase1.length;
        let phase2: typeof phase1 = [];
        if (wantsCancelled && remaining > 0) {
          const useCursor = inPhase2 && cursorConcert;
          phase2 = await tx.concert.findMany({
            where: {
              AND: [
                ...baseAnd,
                {
                  status:
                    ConcertStatus.CANCELED as Prisma.ConcertWhereInput['status'],
                },
              ],
            },
            orderBy,
            cursor: useCursor ? buildCursorObj(cursorConcert) : undefined,
            skip: useCursor ? 1 : 0,
            take: remaining,
          });
        }

        const totalCount = await tx.concert.count({
          where: { AND: [...baseAnd, countStatusCondition] },
        });

        return { merged: [...phase1, ...phase2], totalCount };
      },
    );

    const last = merged[merged.length - 1];
    return {
      data: merged.map(
        (concert) =>
          new ConcertResponseDto(
            concert,
            getConcertDaysLeft(concert.startDate, concert.endDate),
          ),
      ),
      cursor: last ? last.id : null,
      totalCount,
    };
  }

  //대표 아티스트 검색 결과 목록 조회
  async getArtistSearchResults(
    cursor?: number,
    size?: number,
    keyword?: string,
  ) {
    const keywordCondition = keyword
      ? {
          artistName: { contains: keyword },
        }
      : {};

    const [searchResults, totalCount] = await this.prismaService.$transaction([
      this.prismaService.representativeArtist.findMany({
        where: keywordCondition,
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        take: size,
      }),
      this.prismaService.representativeArtist.count({
        where: keywordCondition,
      }),
    ]);

    // 다음 커서 계산
    const last = searchResults[searchResults.length - 1];
    const nextCursor = last ? last.id : null;

    return {
      data: searchResults.map(
        (artist) => new RepresentativeArtistResponseDto(artist),
      ),
      cursor: nextCursor,
      totalCount,
    };
  }
}
