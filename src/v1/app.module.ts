import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConcertModule } from './concert/concert.module';
import { HomeModule } from './home/home.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { SearchModule } from './search/search.module';
import { SetlistModule } from './setlist/setlist.module';
import { PrismaModule } from 'prisma/prisma.module';
import { OpenApiModule } from './open-api/open-api.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UploadModule } from './upload/upload.module';

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
export class AppModuleV1 {}
