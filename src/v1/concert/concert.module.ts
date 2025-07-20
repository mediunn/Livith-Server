import { Module } from '@nestjs/common';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertSchedulerService } from './concert-scheduler.service';

@Module({
  controllers: [ConcertController],
  providers: [ConcertService, PrismaService, ConcertSchedulerService],
})
export class ConcertModule {}
