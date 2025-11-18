import { Module } from '@nestjs/common';
import { LyricsController } from './lyrics.controller';
import { LyricsService } from './lyrics.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [LyricsController],
  providers: [LyricsService, PrismaService],
})
export class LyricsModule {}
