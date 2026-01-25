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

    // cursor 파싱
    let parsedCursor: { value: string; id: number } | undefined;
    if (cursor) {
      try {
        parsedCursor = JSON.parse(cursor);
      } catch (e) {
        throw new BadRequestException(ErrorCode.INVALID_CURSOR_FORMAT);
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

    let orderBy;
    let cursorObj;

    // 정렬 조건에 따른 orderBy 및 cursor 설정
    if (sort === undefined || sort === ConcertSort.LATEST) {
      orderBy = [{ startDate: 'desc' }, { id: 'asc' }];
      if (parsedCursor) {
        cursorObj = {
          startDate_id: { startDate: parsedCursor.value, id: parsedCursor.id },
        };
      }
    } else {
      orderBy = [{ title: 'asc' }, { id: 'asc' }];
      if (parsedCursor) {
        cursorObj = {
          title_id: { title: parsedCursor.value, id: parsedCursor.id },
        };
      }
    }

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

    const searchResults = await this.prismaService.concert.findMany({
      where: where.AND.length > 0 ? where : undefined,
      orderBy,
      skip: parsedCursor ? 1 : 0,
      cursor: cursorObj,
      take: size,
    });

    // 전체 개수
    const totalCount = await this.prismaService.concert.count({
      where: where.AND.length > 0 ? where : undefined,
    });

    // 다음 커서 계산
    const last = searchResults[searchResults.length - 1];
    let nextCursor;
    if (last) {
      nextCursor =
        sort === ConcertSort.LATEST
          ? { value: last.startDate, id: last.id }
          : { value: last.title, id: last.id };
    }

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

    const searchResults =
      await this.prismaService.representativeArtist.findMany({
        where: keywordCondition,
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        take: size,
      });

    // 전체 개수
    const totalCount = await this.prismaService.representativeArtist.count({
      where: keywordCondition,
    });

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
