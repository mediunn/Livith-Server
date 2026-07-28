import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
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
  constructor(
    private readonly prismaService: PrismaService,
    private readonly meilisearchService: MeilisearchService,
  ) {}

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
    const explicitStatuses =
      status && !hasAll ? status.filter((s) => s !== ConcertStatus.ALL) : null;

    // 1. cursor 콘서트 조회 (phase 판단에 사용)
    const cursorConcert = cursor
      ? await this.prismaService.concert.findUnique({
          where: { id: cursor },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            title: true,
            status: true,
          },
        })
      : null;
    if (cursor && !cursorConcert) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    // 2. 공통 필터 (장르 + 키워드)
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

    // 3. status 조건 (count + ALPHABETICAL 공용)
    const statusCondition: Prisma.ConcertWhereInput = explicitStatuses
      ? {
          status: {
            in: explicitStatuses as Prisma.EnumConcertStatusFilter['in'],
          },
        }
      : {};

    // 4. ALPHABETICAL: 단일 phase, title asc
    if (sort === ConcertSort.ALPHABETICAL) {
      const { merged, totalCount } = await this.prismaService.$transaction(
        async (tx) => {
          const items = await tx.concert.findMany({
            where: { AND: [...baseAnd, statusCondition] },
            orderBy: [{ title: 'asc' as const }, { id: 'asc' as const }],
            cursor: cursorConcert
              ? {
                  title_id: {
                    title: cursorConcert.title,
                    id: cursorConcert.id,
                  },
                }
              : undefined,
            skip: cursorConcert ? 1 : 0,
            take: size,
          });

          const totalCount = await tx.concert.count({
            where: { AND: [...baseAnd, statusCondition] },
          });

          return { merged: items, totalCount };
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

    // 5. LATEST: phase 순서 (ONGOING → UPCOMING → COMPLETED → CANCELED)
    type PhaseDef = {
      status: ConcertStatus;
      extraWhere?: Prisma.ConcertWhereInput;
      orderBy: Prisma.ConcertOrderByWithRelationInput[];
      cursorBuilder: (
        c: NonNullable<typeof cursorConcert>,
      ) => Prisma.ConcertWhereUniqueInput;
    };

    const ALL_PHASES: PhaseDef[] = [
      {
        status: ConcertStatus.ONGOING,
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        cursorBuilder: (c) => ({
          startDate_id: { startDate: c.startDate, id: c.id },
        }),
      },
      {
        status: ConcertStatus.UPCOMING,
        extraWhere: { startDate: { not: null } },
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        cursorBuilder: (c) => ({
          startDate_id: { startDate: c.startDate, id: c.id },
        }),
      },
      {
        status: ConcertStatus.COMPLETED,
        orderBy: [{ endDate: 'desc' }, { id: 'desc' }],
        cursorBuilder: (c) => ({
          endDate_id: { endDate: c.endDate, id: c.id },
        }),
      },
      {
        status: ConcertStatus.CANCELED,
        orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
        cursorBuilder: (c) => ({
          startDate_id: { startDate: c.startDate, id: c.id },
        }),
      },
      {
        status: ConcertStatus.UPCOMING,
        extraWhere: { startDate: null },
        orderBy: [{ id: 'desc' }],
        cursorBuilder: (c) => ({ id: c.id }),
      },
    ];

    const allowedStatuses = explicitStatuses
      ? new Set<string>(explicitStatuses)
      : null;
    const activePhases = allowedStatuses
      ? ALL_PHASES.filter((p) => allowedStatuses.has(p.status))
      : ALL_PHASES;

    const cursorPhaseIdx = cursorConcert
      ? activePhases.findIndex((p) => {
          if (p.status !== cursorConcert.status) return false;
          // UPCOMING은 두 phase로 분리되어 있어 startDate null 여부로 구분
          if (p.status === ConcertStatus.UPCOMING) {
            const isNoDatePhase = p.extraWhere?.startDate === null;
            return isNoDatePhase
              ? cursorConcert.startDate === null
              : cursorConcert.startDate !== null;
          }
          return true;
        })
      : -1;
    const startIdx = cursorPhaseIdx >= 0 ? cursorPhaseIdx : 0;

    const { merged, totalCount } = await this.prismaService.$transaction(
      async (tx) => {
        const collected: Awaited<ReturnType<typeof tx.concert.findMany>> = [];
        let remaining = size;

        for (let i = startIdx; i < activePhases.length && remaining > 0; i++) {
          const phase = activePhases[i];
          const useCursor = i === cursorPhaseIdx && !!cursorConcert;

          const items = await tx.concert.findMany({
            where: {
              AND: [
                ...baseAnd,
                {
                  status: phase.status as Prisma.ConcertWhereInput['status'],
                },
                phase.extraWhere ?? {},
              ],
            },
            orderBy: phase.orderBy,
            cursor: useCursor ? phase.cursorBuilder(cursorConcert!) : undefined,
            skip: useCursor ? 1 : 0,
            take: remaining,
          });

          collected.push(...items);
          remaining -= items.length;
        }

        const totalCount = await tx.concert.count({
          where: { AND: [...baseAnd, statusCondition] },
        });

        return { merged: collected, totalCount };
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
    if (keyword) {
      const offset = cursor ?? 0;
      const limit = size ?? 20;

      const { ids, totalCount } = await this.meilisearchService.search(
        keyword,
        offset,
        limit,
      );

      if (ids.length === 0) {
        return { data: [], cursor: null, totalCount: 0 };
      }

      const rows = await this.prismaService.representativeArtist.findMany({
        where: { id: { in: ids } },
      });

      const idOrder = new Map(ids.map((id, i) => [id, i]));
      const data = rows
        .sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id))
        .map((artist) => new RepresentativeArtistResponseDto(artist));

      const nextCursor = ids.length === limit ? offset + limit : null;

      return { data, cursor: nextCursor, totalCount };
    }

    const [searchResults, totalCount] = await this.prismaService.$transaction([
      this.prismaService.representativeArtist.findMany({
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        take: size,
      }),
      this.prismaService.representativeArtist.count(),
    ]);

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
