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

    return {
      title: '아티스트 콘서트 오픈',
      content: concert
        ? `${concert.artist} 콘서트가 등록되었어요!`
        : '새로운 콘서트가 등록되었어요!',
    };
  }
}
