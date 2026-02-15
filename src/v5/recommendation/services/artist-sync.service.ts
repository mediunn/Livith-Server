import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma-v5/prisma.service';
import { LastfmApiService } from '../integrations/lastfm/last-fm.api.service';
import { ArtistImageService } from './artist-image.service';
import { Cron } from '@nestjs/schedule';
import { getLastfmTag } from '../integrations/lastfm/genre-mapping.util';
import {
  YoutubeApiErrorType,
  YoutubeApiService,
} from '../integrations/youtube/youtube.api.service';

@Injectable()
export class ArtistSyncService {
  private readonly logger = new Logger(ArtistSyncService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly lastfmApiService: LastfmApiService,
    private readonly artistImageService: ArtistImageService,
    private readonly youtubeApiService: YoutubeApiService,
  ) {}

  // 6개월마다 1일 새벽 2시: 아티스트 목록만 동기화
  @Cron('0 2 1 */6 *', {
    timeZone: 'Asia/Seoul',
  })
  async syncRepresentativeArtists(): Promise<number> {
    this.logger.log('Starting representative artists sync (every 6 months)');
    const genres = await this.prismaService.genre.findMany();

    for (const genre of genres) {
      await this.syncGenreArtists(genre.id, genre.name);
    }

    this.logger.log('Representative artists sync completed');
    return genres.length;
  }

  private async syncGenreArtists(genreId: number, genreName: string) {
    const lastfmTag = getLastfmTag(genreName);

    this.logger.log(
      `Syncing top 200 artists for genre: ${genreName} (Last.fm tag: ${lastfmTag})`,
    );

    const artists = await this.lastfmApiService.getTopArtistByTag(
      lastfmTag,
      200,
    );

    // DB에 Upsert
    for (const artist of artists) {
      await this.prismaService.representativeArtist.upsert({
        where: {
          genreId_artistName: {
            genreId: genreId,
            artistName: artist.name,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          genreId: genreId,
          artistName: artist.name,
          imgUrl: '',
        },
      });
    }
  }

  @Cron('0 3 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async syncArtistImages(): Promise<number> {
    const artistsWithoutImage =
      await this.prismaService.representativeArtist.findMany({
        where: { imgUrl: '' },
        take: 90,
        orderBy: { createdAt: 'asc' },
        include: { genre: true },
      });

    if (artistsWithoutImage.length === 0) {
      return 0;
    }

    let processedCount = 0;

    for (const artist of artistsWithoutImage) {
      const result = await this.youtubeApiService.getArtistImageUrl(
        artist.artistName,
      );

      // 할당량 초과 시 중단
      if (result.errorType === YoutubeApiErrorType.QUOTA_EXCEEDED) {
        this.logger.error('YouTube API quota exceeded. Stopping sync.');
        break;
      }

      let imgUrl = result.imgUrl;

      // YouTube에서 이미지를 못 가져온 경우, 장르 이미지로 대체
      if (!imgUrl) {
        imgUrl = artist.genre.imgUrl || '';
      }

      await this.prismaService.representativeArtist.update({
        where: { id: artist.id },
        data: { imgUrl: imgUrl },
      });

      processedCount++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return processedCount;
  }
}
