import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prismaService: PrismaService) {}

  //추천 검색어 조회
  async getRecommendWords(letter: string) {
    const recommendWords = await this.prismaService.concert.findMany({
      where: {
        OR: [{ title: { contains: letter } }, { artist: { contains: letter } }],
      },
      take: 10,
      orderBy: {
        sortedIndex: 'asc',
      },
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
}
