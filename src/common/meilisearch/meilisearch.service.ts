import { Injectable, OnModuleInit } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private client: MeiliSearch;

  onModuleInit() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }

  getClient(): MeiliSearch {
    return this.client;
  }

  getIndex(indexName: string) {
    return this.client.index(indexName);
  }
}
