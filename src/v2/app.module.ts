import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConcertModule } from 'src/v2/concert/concert.module';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';
import { SetlistModule } from './setlist/setlist.module';
import { SongModule } from './song/song.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConcertModule,
    SetlistModule,
    SongModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor, // 인터셉터 등록
    },
  ],
})
export class AppModuleV2 {}
