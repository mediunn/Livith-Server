import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { BannerResponseDto } from './dto/banner-response.dto';
import { SearchSectionResponseDto } from './dto/search-section-response.dto';
import { ConcertSort } from '../common/enums/concert-sort.enum';
import { ConcertGenre } from '../common/enums/concert-genre.enum';
import { ConcertStatus } from '../common/enums/concert-status.enum';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getConcertDaysLeft } from '../common/utils/date.util';
import { GenreType } from '@prisma/client';
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
    const { genre, status, sort, keyword, cursor, size } = query;

    const hasAll = status?.includes(ConcertStatus.ALL) ?? false;

    // 1. cursor 콘서트 조회 -> composite cursor 구성
    const cursorConcert = cursor
      ? await this.prismaService.concert.findUnique({
          where: { id: cursor },
          select: { id: true, startDate: true, title: true },
        })
      : null;
    if (cursor && !cursorConcert) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    // 2. 정렬 조건 (가나다순 또는 공연 날짜순)
    const orderBy =
      sort === ConcertSort.ALPHABETICAL
        ? [{ title: 'asc' as const }, { id: 'asc' as const }]
        : [{ startDate: 'asc' as const }, { id: 'asc' as const }];

    // 3. composite cursor 구성
    let cursorObj;
    if (cursorConcert) {
      cursorObj =
        sort === ConcertSort.ALPHABETICAL
          ? {
              title_id: { title: cursorConcert.title, id: cursorConcert.id },
            }
          : {
              startDate_id: {
                startDate: cursorConcert.startDate,
                id: cursorConcert.id,
              },
            };
    }

    // 4. WHERE 조건
    const where = { AND: [] };

    if (status && !hasAll) {
      where.AND.push({ status: { in: status } });
    } else {
      // ALL 또는 미입력 시 CANCELED 제외
      where.AND.push({ status: { not: ConcertStatus.CANCELED } });
    }

    if (genre && !genre.includes(ConcertGenre.ALL)) {
      const prismaGenres = genre.map(
        (g) => GenreType[g as keyof typeof GenreType],
      );
      where.AND.push({
        concertGenre: { some: { genre: { name: { in: prismaGenres } } } },
      });
    }

    if (keyword) {
      where.AND.push({
        OR: [
          { title: { contains: keyword } },
          { artist: { contains: keyword } },
        ],
      });
    }

    // 5. 쿼리 실행
    const [searchResults, totalCount] = await this.prismaService.$transaction([
      this.prismaService.concert.findMany({
        where,
        orderBy,
        skip: cursor ? 1 : 0,
        cursor: cursorObj,
        take: size,
      }),
      this.prismaService.concert.count({ where }),
    ]);

    const last = searchResults[searchResults.length - 1];
    return {
      data: searchResults.map(
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
