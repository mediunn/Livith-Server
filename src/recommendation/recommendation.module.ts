import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LastfmApiService } from "./integrations/lastfm/last-fm.api.service";
import { MusicApiFactoryService } from "./services/music-api-factory.service";
import { YoutubeApiService } from "./integrations/youtube/youtube.api.service";
import { ArtistImageService } from "./services/artist-image.service";
import { ArtistSyncService } from "./services/artist-sync.service";
import { PrismaModule } from "prisma/prisma.module";



@Module({
    imports: [HttpModule, ConfigModule, PrismaModule],
    providers: [LastfmApiService, MusicApiFactoryService, YoutubeApiService, ArtistImageService, ArtistSyncService],
    exports: [MusicApiFactoryService, LastfmApiService],
})
export class RecommendationModule{}