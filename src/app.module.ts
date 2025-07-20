import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConcertModule } from './v1/concert/concert.module';
import { HomeModule } from './v1/home/home.module';
import { LyricsModule } from './v1/lyrics/lyrics.module';
import { SearchModule } from './v1/search/search.module';
import { SetlistModule } from './v1/setlist/setlist.module';
import { PrismaModule } from 'prisma/prisma.module';
import { OpenApiModule } from './v1/open-api/open-api.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GlobalResponseInterceptor } from './v1/common/interceptors/global-response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UploadModule } from './v1/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConcertModule,
    HomeModule,
    LyricsModule,
    SearchModule,
    SetlistModule,
    OpenApiModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    UploadModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor, // 인터셉터 등록
    },
  ],
})
export class AppModule {}
