import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { BannerResponseDto } from './dto/banner-response.dto';
import { SearchSectionResponseDto } from './dto/search-section-response.dto';
import { ConcertSort } from '../common/enums/concert-sort.enum';
import { ConcertGenre } from '../common/enums/concert-genre.enum';
import { ConcertStatus } from '../common/enums/concert-status.enum';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getDaysUntil } from '../common/utils/date.util';
import { GenreType } from '@prisma/client';
import { GetConcertSearchResultsDto } from './dto/get-concert-search-results.dto';
import { BadRequestException } from '../common/exceptions/business.exception';
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

    // 1, cursor -> 해당 콘서트 조회해서 composite cursor 구성
    let cursorObj;
    if (cursor) {
      const cursorConcert = await this.prismaService.concert.findUnique({
        where: { id: cursor },
        select: { id: true, startDate: true, title: true },
      });

      if (!cursorConcert) {
        throw new BadRequestException(ErrorCode.INVALID_CURSOR_FORMAT);
      }

      if (sort === ConcertSort.ALPHABETICAL) {
        cursorObj = {
          title_id: { title: cursorConcert.title, id: cursorConcert.id },
        };
      } else {
        cursorObj = {
          startDate_id: {
            startDate: cursorConcert.startDate,
            id: cursorConcert.id,
          },
        };
      }
    }

    // 키워드 검색 조건
    const keywordCondition = keyword
      ? {
          OR: [
            { title: { contains: keyword } },
            { artist: { contains: keyword } },
          ],
        }
      : undefined;

    // 3. 정렬 조건
    let orderBy;
    if (sort === ConcertSort.ALPHABETICAL) {
      orderBy = [{ title: 'asc' }, { id: 'asc' }];
    } else {
      // 공연 날짜 가까운 순
      orderBy = [{ startDate: 'asc' }, { id: 'asc' }];
    }

    // 4. WHERE 조건 조합
    const where = {
      AND: [],
    };

    if (status && !status.includes(ConcertStatus.ALL)) {
      where.AND.push({ status: { in: status } });
    }

    // genre 조건 (Prisma enum 변환)
    if (genre && !genre.includes(ConcertGenre.ALL)) {
      const prismaGenres = genre.map(
        (g) => GenreType[g as keyof typeof GenreType],
      );

      where.AND.push({
        concertGenre: { some: { genre: { name: { in: prismaGenres } } } },
      });
    }

    if (keyword) {
      where.AND.push(keywordCondition);
    }

    // 5. 쿼리 실행
    const whereClause = where.AND.length > 0 ? where : undefined;

    const [searchResults, totalCount] =
      await this.prismaService.concert.findMany({
        where: whereClause,
        orderBy,
        skip: cursor ? 1 : 0,
        cursor: cursorObj,
        take: size,
      });

    // 전체 개수
    const totalCount = await this.prismaService.concert.count({
      where: where.AND.length > 0 ? where : undefined,
    });

    // 6. 다음 커서 계산
    const last = searchResults[searchResults.length - 1];
    const nextCursor = last ? last.id : null;

    return {
      data: searchResults.map(
        (concert) =>
          new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
      ),
      cursor: nextCursor,
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
