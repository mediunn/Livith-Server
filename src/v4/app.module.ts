import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalResponseInterceptor } from './common/interceptors/global-response.interceptor';
import { AuthModule } from './auth/auth.module';
import { ConcertModule } from './concert/concert.module';
import { HomeModule } from './home/home.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    ConcertModule,
    HomeModule,
    SearchModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor, // 인터셉터 등록
    },
  ],
})
export class AppModuleV4 {}
