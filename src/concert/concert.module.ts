import { Module } from '@nestjs/common';
import { ConcertService } from './concert.service';
import { ConcertController } from './concert.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [ConcertService, PrismaService],
  controllers: [ConcertController],
})
export class ConcertModule {}
