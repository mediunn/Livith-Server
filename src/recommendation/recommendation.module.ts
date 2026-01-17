import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LastfmApiService } from "./services/last-fm.api.service";
import { MusicApiFactoryService } from "./services/music-api-factory.service";
import { PrismaModule } from "prisma/prisma.module";
import { RecommendationController } from "./recommendation.controller";
import { RecommendationService } from "./services/recommendation.service";



@Module({
    imports: [HttpModule, ConfigModule, PrismaModule],
    controllers: [RecommendationController],
    providers: [LastfmApiService, MusicApiFactoryService, RecommendationService],
    exports: [MusicApiFactoryService, LastfmApiService],
})
export class RecommendationModule{}