import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { getDaysUntil } from 'src/common/utils/date.util';
import { ConcertResponseDto } from 'src/concert/dto/concert-response.dto';

@Injectable()
export class SearchService {
  constructor(private readonly prismaService: PrismaService) {}
  // 추천 검색어를 가져오는 메서드
  async getRecommendWords(letter: string) {
    const recommendWords = await this.prismaService.concert.findMany({
      where: {
        OR: [{ title: { contains: letter } }, { artist: { contains: letter } }],
      },
      take: 5,
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

  // 검색어에 대한 결과를 가져오는 메서드
  async getSearchResults(keyword: string, cursor: number, size: number) {
    if (!keyword.trim()) {
      return []; // 검색어가 비어있을 경우 빈 배열 반환
    }
    const searchResults = await this.prismaService.concert.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { artist: { contains: keyword } },
        ],
      },
      cursor: cursor ? { sortedIndex: cursor } : undefined,
      take: size,
      skip: cursor ? 1 : 0, // cursor가 있을 때만 건너뛰기
      orderBy: { sortedIndex: 'asc' },
    });

    const resultsWithDaysLeft = searchResults.map((result) => {
      return new ConcertResponseDto({
        ...result,
        daysLeft: getDaysUntil(result.startDate),
      });
    });

    return resultsWithDaysLeft;
  }
}
