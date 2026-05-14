import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { normalizeArtistName } from 'src/common/utils/artist-name.util';

@Injectable()
export class ArtistMatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 콘서트 아티스트명과 매칭되는 대표 아티스트 ID 목록 반환
   * (1,200건 정도면 단일 쿼리로 충분)
   */
  async findMatchingRepresentativeArtistIds(
    concertArtistName: string,
  ): Promise<number[]> {
    const normalized = normalizeArtistName(concertArtistName);

    const allArtists = await this.prisma.representativeArtist.findMany({
      select: { id: true, artistName: true },
    });

    return allArtists
      .filter((ra) => normalizeArtistName(ra.artistName) === normalized)
      .map((ra) => ra.id);
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
