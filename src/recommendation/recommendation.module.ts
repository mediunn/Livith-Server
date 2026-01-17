import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LastfmApiService } from "./services/last-fm.api.service";
import { MusicApiFactoryService } from "./services/music-api-factory.service";



@Module({
    imports: [HttpModule, ConfigModule],
    providers: [LastfmApiService, MusicApiFactoryService],
    exports: [MusicApiFactoryService, LastfmApiService],
})
export class RecommendationModule{}