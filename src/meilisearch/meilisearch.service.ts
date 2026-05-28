import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Index, MeiliSearch } from 'meilisearch';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

export interface ArtistDocument {
  id: number;
  artistName: string;
  genreId: number;
}

const INDEX_NAME = 'artists';

type ReindexFailureReason = 'timeout' | 'http_error' | 'unknown';

function classifyReindexError(err: unknown): ReindexFailureReason {
  if (err instanceof Error) {
    if (/timeout/i.test(err.message)) return 'timeout';
    if (/\b[45]\d{2}\b/.test(err.message)) return 'http_error';
  }
  return 'unknown';
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private readonly client: MeiliSearch;
  private index: Index<ArtistDocument>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectMetric('meilisearch_search_duration_seconds')
    private readonly searchDuration: Histogram<string>,
    @InjectMetric('search_result_total')
    private readonly searchResultCounter: Counter<string>,
    @InjectMetric('meilisearch_reindex_failure_total')
    private readonly reindexFailureCounter: Counter<string>,
  ) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('MEILISEARCH_HOST'),
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  async onModuleInit() {
    try {
      this.index = this.client.index<ArtistDocument>(INDEX_NAME);
      await this.index.updateSettings({
        searchableAttributes: ['artistName'],
        filterableAttributes: ['genreId'],
      });
      this.logger.log('Meilisearch index settings ready');
    } catch (err) {
      this.logger.warn(
        `Meilisearch connection failed: ${err instanceof Error ? err.message : String(err)}. Running without search.`,
      );
    }
  }

  async bulkUpsertAll(): Promise<number> {
    const artists = await this.prisma.representativeArtist.findMany({
      select: { id: true, artistName: true, genreId: true },
    });

    if (artists.length === 0) {
      this.logger.log('Meilisearch reindex skipped: no artists');
      return 0;
    }

    try {
      await this.index.addDocuments(artists, { primaryKey: 'id' });
      this.logger.log(`Meilisearch reindex enqueued: ${artists.length}건`);
      return artists.length;
    } catch (err) {
      const reason = classifyReindexError(err);
      this.reindexFailureCounter.inc({ reason });
      throw err;
    }
  }

  async search(
    keyword: string,
    offset: number,
    limit: number,
  ): Promise<{ ids: number[]; totalCount: number }> {
    const endTimer = this.searchDuration.startTimer();
    try {
      const result = await this.index.search(keyword, { offset, limit });
      const ids = result.hits.map((hit) => hit.id);
      const totalCount = result.estimatedTotalHits ?? result.hits.length;
      this.searchResultCounter.inc({
        has_result: totalCount > 0 ? 'yes' : 'no',
      });
      return { ids, totalCount };
    } finally {
      endTimer();
    }
  }
}
