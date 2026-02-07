import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { LastfmApiService } from '../integrations/lastfm/last-fm.api.service';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';
import { ConcertResponseDto } from 'src/concert/dto/concert-response.dto';
import { getDaysUntil } from 'src/common/utils/date.util';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly lastfmApiService: LastfmApiService,
  ) {}

  private async getConcertByGenreIds(genreIds: number[]) {
    if (!genreIds || genreIds.length === 0) {
      return [];
    }

    const concerts = await this.prismaService.concert.findMany({
      where: {
        concertGenre: {
          some: {
            genreId: { in: genreIds },
          },
        },
        status: { in: [ConcertStatus.UPCOMING, ConcertStatus.ONGOING] },
      },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: 20,
      distinct: ['id'],
    });

    return concerts.map(
      (concert) =>
        new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
    );
  }

  // 추천 콘서트 조회
  async getRecommendConcerts(userId: number) {
    // 유저의 선호 아티스트 조회
    const userArtists = await this.prismaService.userArtist.findMany({
      where: { userId },
      include: { artist: true },
      orderBy: { createdAt: 'desc' },
    });

    if (userArtists.length === 0) {
      // 장르 기반 추천
      return this.getConcertByUserGenres(userId);
    }

    // 유저가 선택한 아티스트의 장르 + 유저가 직접 설정한 장르를 합산
    const inferredGenreIds = userArtists
      .map((ua) => ua.artist?.genreId)
      .filter((id): id is number => typeof id === 'number');

    const userGenres = await this.prismaService.userGenre.findMany({
      where: { userId },
      select: { genreId: true },
    });
    const userGenreIds = userGenres.map((ug) => ug.genreId);

    const combinedGenreIds = Array.from(
      new Set([...inferredGenreIds, ...userGenreIds]),
    );

    // 병렬로 유사 아티스트 조회
    const similarArtists = userArtists.map((userArtist) =>
      this.lastfmApiService.getSimilarArtists(userArtist.artistName),
    );

    const simlarArtistArrays = await Promise.all(similarArtists);

    // 모든 유사 아티스트 이름 수집
    const allSimilarArtists = new Set<string>();
    simlarArtistArrays.forEach((artists) => {
      artists.forEach((artist) => allSimilarArtists.add(artist));
    });

    // 유사 아티스트 이름으로 Artist 테이블 조회하여 artistId 찾기
    const similarArtistNames = Array.from(allSimilarArtists);

    const allArtists = await this.prismaService.artist.findMany({
      select: { id: true, artist: true },
    });

    // 영문 이름만 추출 (괄호 앞부분, 공백 제거, 대소문자 무시)
    const matchedArtistIds = allArtists
      .filter((a) => {
        const artistName = a.artist.split('(')[0].trim().toLowerCase();
        return similarArtistNames.some(
          (similar) => similar.toLowerCase() === artistName,
        );
      })
      .map((a) => a.id);

    if (matchedArtistIds.length === 0) {
      return this.getConcertByGenreIds(combinedGenreIds);
    }

    // 아티스트 매칭 콘서트 + 장르 기반 콘서트를 합산
    const [artistConcerts, genreConcerts] = await Promise.all([
      this.prismaService.concert.findMany({
        where: {
          artistId: { in: matchedArtistIds },
          status: { in: [ConcertStatus.UPCOMING, ConcertStatus.ONGOING] },
        },
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        take: 20,
      }),
      this.getConcertByGenreIds(combinedGenreIds),
    ]);

    // 아티스트 매칭 콘서트를 우선 배치하고, 나머지 슬롯을 장르 기반으로 채움
    const artistConcertDtos = artistConcerts.map(
      (concert) =>
        new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
    );

    const artistConcertIds = new Set(artistConcerts.map((c) => c.id));
    const uniqueGenreConcerts = genreConcerts.filter(
      (gc) => !artistConcertIds.has(gc.id),
    );

    return [...artistConcertDtos, ...uniqueGenreConcerts].slice(0, 20);
  }

  // 장르 기반 추천
  private async getConcertByUserGenres(userId: number) {
    const userGenres = await this.prismaService.userGenre.findMany({
      where: { userId },
      include: { genre: true },
    });

    if (userGenres.length === 0) {
      return [];
    }

    const genreIds = userGenres.map((ug) => ug.genreId);
    return this.getConcertByGenreIds(genreIds);
  }
}
