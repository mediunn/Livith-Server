import { Module } from '@nestjs/common';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [ConcertController],
  providers: [ConcertService, PrismaService],
})
export class ConcertModule {}
