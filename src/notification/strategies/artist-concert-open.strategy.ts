import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ArtistMatchingService } from 'src/artist/service/artist-matching.service';
import {
  NotificationStrategy,
  NotificationTargetParams,
  NotificationMessage,
} from './notification-strategy.interface';
import { BatchProcessor } from 'src/common/utils/batch-processor.util';
import { NOTIFICATION_BATCH_SIZE } from '../constants/notification.constants';

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

    // 유효한 유저만 필터링
    const validUserIds: number[] = [];
    await BatchProcessor.processInChunks(
      userIds,
      NOTIFICATION_BATCH_SIZE,
      async (chunk) => {
        const users = await this.prisma.user.findMany({
          where: { id: { in: chunk }, deletedAt: null },
          select: { id: true },
        });
        validUserIds.push(...users.map((u) => u.id));
      },
    );

    return validUserIds;
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
