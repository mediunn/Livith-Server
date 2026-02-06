import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { normalizeArtistName } from 'src/common/utils/artist-name.util';
import { NOTIFICATION_ARTIST_BATCH_SIZE } from 'src/notification/constants/notification.constants';
import { BatchProcessor } from 'src/common/utils/batch-processor.util';

@Injectable()
export class ArtistMatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 콘서트 아티스명과 매칭되는 대표 아티스트 ID 목록 반환
   */
  async findMatchingRepresentativeArtistIds(
    concertArtistName: string,
  ): Promise<number[]> {
    const normalized = normalizeArtistName(concertArtistName);
    const matchedIds: number[] = [];

    await BatchProcessor.processPaginated({
      batchSize: NOTIFICATION_ARTIST_BATCH_SIZE,
      fetchBatch: (skip, take) =>
        this.prisma.representativeArtist.findMany({
          select: { id: true, artistName: true },
          skip,
          take,
        }),
      processBatch: async (candidates) => {
        const matched = candidates
          .filter((ra) => normalizeArtistName(ra.artistName) === normalized)
          .map((ra) => ra.id);
        matchedIds.push(...matched);
      },
    });

    return matchedIds;
  }

  /**
   * 대표 아티스트 ID 목록으로 해당 아티스트를 좋아하는 유저 ID 목록 반환
   */
  async findUserIdsByArtistIds(artistIds: number[]): Promise<number[]> {
    if (artistIds.length === 0) return [];

    const userArtists = await this.prisma.userArtist.findMany({
      where: {
        artistId: { in: artistIds },
        user: { deletedAt: null },
      },
      select: { userId: true },
    });

    return [...new Set(userArtists.map((ua) => ua.userId))];
  }
}
