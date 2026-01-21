import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LastfmApiService } from "./integrations/lastfm/last-fm.api.service";
import { MusicApiFactoryService } from "./services/music-api-factory.service";
import { PrismaModule } from "prisma/prisma.module";
import { RecommendationController } from "./recommendation.controller";
import { RecommendationService } from "./services/recommendation.service";
import { YoutubeApiService } from "./integrations/youtube/youtube.api.service";
import { ArtistImageService } from "./services/artist-image.service";
import { ArtistSyncService } from "./services/artist-sync.service";
import { GlobalArtistCacheService } from "./services/global-artist-cache.service";



@Module({
    imports: [HttpModule, ConfigModule, PrismaModule],
    controllers: [RecommendationController],
    providers: [LastfmApiService, MusicApiFactoryService, YoutubeApiService, ArtistImageService, ArtistSyncService, RecommendationService, GlobalArtistCacheService],
    exports: [MusicApiFactoryService, LastfmApiService, GlobalArtistCacheService],
})
export class RecommendationModule{}