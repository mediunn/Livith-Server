import { Global, Module } from '@nestjs/common';
import { MeilisearchService } from './meilisearch.service';
import { MeilisearchController } from './meilisearch.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConcertArtistIndexService } from './concert-artist-index.service';
import { MeilisearchScheduler } from './meilisearch.scheduler';
import { MetricsModule } from '../metrics/metrics.module';

@Global()
@Module({
  imports: [PrismaModule, MetricsModule],
  controllers: [MeilisearchController],
  providers: [
    MeilisearchService,
    ConcertArtistIndexService,
    MeilisearchScheduler,
  ],
  exports: [MeilisearchService, ConcertArtistIndexService],
})
export class MeilisearchModule {}
