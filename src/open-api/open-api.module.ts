import { Module } from '@nestjs/common';
import { OpenApiService } from './open-api.service';
import { PrismaModule } from 'prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { FetchConcertService } from './fetch-concert.service';
@Module({
  imports: [PrismaModule, HttpModule],
  providers: [OpenApiService, FetchConcertService],
})
export class OpenApiModule {}
