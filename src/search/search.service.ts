import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prismaService: PrismaService) {}
  async getRecommendWords(letter: string) {
    const recommendWords = await this.prismaService.concert.findMany({
      where: {
        OR: [
          {
            title: {
              contains: letter,
            },
          },
          {
            artist: {
              contains: letter,
            },
          },
        ],
      },
      take: 5, // 결과 갯수 제한
    });

    // title이나 artist에 포함된 값만 필터링
    const filteredResults = recommendWords.map((concert) => {
      // title에 포함된 경우
      if (concert.title.includes(letter)) {
        return concert.title;
      }
      // artist에 포함된 경우
      if (concert.artist.includes(letter)) {
        return concert.artist;
      }
    });

    return filteredResults;
  }
}
