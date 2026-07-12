import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Index, Meilisearch } from 'meilisearch';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface ConcertArtistDocument {
  id: number;
  name: string;
  searchNames: string[];
}

const INDEX_NAME = 'concert-artists';

@Injectable()
export class ConcertArtistIndexService implements OnModuleInit {
  private readonly logger = new Logger(ConcertArtistIndexService.name);
  private readonly client: Meilisearch;
  private index: Index<ConcertArtistDocument>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.client = new Meilisearch({
      host: this.configService.get<string>('MEILISEARCH_HOST'),
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  async onModuleInit() {
    this.index = this.client.index<ConcertArtistDocument>(INDEX_NAME);
    await this.index.updateSettings({
      searchableAttributes: ['name', 'searchNames'],
    });
    this.logger.log('concert-artists index settings ready');
  }

  async bulkUpsertAll(): Promise<number> {
    const artists = await this.prisma.artist.findMany({
      select: { id: true, artist: true },
    });
    if (artists.length === 0) {
      this.logger.log('concert-artists reindex skipped: no artists');
      return 0;
    }
    await this.index.addDocuments(
      artists.map((a) => {
        const names = this.splitArtistName(a.artist);
        return {
          id: a.id,
          name: a.artist,
          // 공백 제거 변형 자동 추가 ("원 오크 록" ↔ "원오크록" 흡수)
          searchNames: [
            ...new Set([...names, ...names.map((n) => n.replace(/\s+/g, ''))]),
          ],
        };
      }),
      { primaryKey: 'id' },
    );
    this.logger.log(`concert-artists reindex enqueued: ${artists.length}건`);
    return artists.length;
  }

  async matchArtist(
    extractName: string,
  ): Promise<{ artistId: number; name: string }[]> {
    const result = await this.index.search(extractName, { limit: 3 });
    return result.hits.map((hit) => ({ artistId: hit.id, name: hit.name }));
  }

  /**
   * 분해하여 meilisearch에 색인
   */
  private splitArtistName(raw: string): string[] {
    const variants = new Set<string>([raw]);
    const match = raw.match(/^(.*?)\s*[（(]([^()（）]+)[)）]\s*$/);
    if (match) {
      const base = match[1].trim();
      const inParens = match[2].trim();
      if (base) variants.add(base);
      if (inParens) variants.add(inParens);
    }
    return [...variants];
  }
}
