import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LastfmApiService } from './integrations/lastfm/last-fm.api.service';
import { MusicApiFactoryService } from './services/music-api-factory.service';
import { YoutubeApiService } from './integrations/youtube/youtube.api.service';
import { ArtistImageService } from './services/artist-image.service';
import { ArtistSyncService } from './services/artist-sync.service';
import { PrismaModule } from '../../../prisma-v5/prisma.module';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './services/recommendation.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [HttpModule, ConfigModule, PrismaModule, MetricsModule],
  controllers: [RecommendationController],
  providers: [
    LastfmApiService,
    MusicApiFactoryService,
    YoutubeApiService,
    ArtistImageService,
    ArtistSyncService,
    RecommendationService,
  ],
  exports: [MusicApiFactoryService, LastfmApiService, RecommendationService],
})
export class RecommendationModule {}
