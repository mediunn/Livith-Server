import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Index, MeiliSearch } from 'meilisearch';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface ArtistDocument {
  id: number;
  artistName: string;
  genreId: number;
}

const INDEX_NAME = 'artists';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private readonly client: MeiliSearch;
  private index: Index<ArtistDocument>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILISEARCH_HOST'),
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  async onModuleInit() {
    this.index = this.client.index<ArtistDocument>(INDEX_NAME);
    await this.index.updateSettings({
      searchableAttributes: ['artistName'],
      filterableAttributes: ['genreId'],
    });
    this.logger.log('Meilisearch index settings ready');
  }

  async bulkUpsertAll(): Promise<number> {
    const artists = await this.prisma.representativeArtist.findMany({
      select: { id: true, artistName: true, genreId: true },
    });

    if (artists.length === 0) {
      this.logger.log('Meilisearch reindex skipped: no artists');
      return 0;
    }

    await this.index.addDocuments(artists, { primaryKey: 'id' });
    this.logger.log(`Meilisearch reindex enqueued: ${artists.length}건`);
    return artists.length;
  }

  async search(
    keyword: string,
    offset: number,
    limit: number,
  ): Promise<number[]> {
    const result = await this.index.search(keyword, { offset, limit });
    return result.hits.map((hit) => hit.id);
  }
}
