import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../../prisma-v5/prisma.service';
import { ArtistMatchingService } from '../../artist/service/artist-matching.service';
import {
  NotificationStrategy,
  NotificationTargetParams,
  NotificationMessage,
} from './notification-strategy.interface';

@Injectable()
export class ArtistConcertOpenStrategy implements NotificationStrategy {
  readonly type = NotificationType.ARTIST_CONCERT_OPEN;

  constructor(
    private readonly prisma: PrismaService,
    private readonly artistMatchingService: ArtistMatchingService,
  ) {}

  async getTargetUserIds(params: NotificationTargetParams): Promise<number[]> {
    const { concertId } = params;
    if (!concertId) return [];

    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
      select: { artist: true },
    });
    if (!concert) return [];

    const representativeArtistIds =
      await this.artistMatchingService.findMatchingRepresentativeArtistIds(
        concert.artist,
      );

    if (representativeArtistIds.length === 0) return [];

    const userIds = await this.artistMatchingService.findUserIdsByArtistIds(
      representativeArtistIds,
    );

    return userIds;
  }

  async buildMessage(
    params: NotificationTargetParams,
  ): Promise<NotificationMessage> {
    const { concertId } = params;
    const concert = await this.prisma.concert.findUnique({
      where: { id: concertId },
      select: { artist: true },
    });

    const artistName = concert?.artist ?? '아티스트';
    return {
      title: `${artistName} 아티스트의 콘서트 오픈🔥`,
      content: `선호 아티스트 ${artistName}의 내한 공연 소식이 도착했어요!`,
    };
  }
}
