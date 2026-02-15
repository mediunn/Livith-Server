import { Module } from '@nestjs/common';
import { SongController } from './song.controller.js';
import { SongService } from './song.service.js';
import { PrismaService } from '../../../prisma-v5/prisma.service.js';

@Module({
  controllers: [SongController],
  providers: [SongService, PrismaService],
})
export class SongModule {}
