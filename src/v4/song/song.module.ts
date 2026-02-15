import { Module } from '@nestjs/common';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { PrismaService } from '../../../prisma-v4/prisma.service';

@Module({
  controllers: [SongController],
  providers: [SongService, PrismaService],
})
export class SongModule {}
