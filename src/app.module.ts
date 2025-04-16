import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConcertModule } from './concert/concert.module';
import { HomeModule } from './home/home.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { SearchModule } from './search/search.module';
import { SetlistModule } from './setlist/setlist.module';
import { PrismaModule } from 'prisma/prisma.module';
import { OpenapiModule } from './openapi/openapi.module';

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
    OpenapiModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
