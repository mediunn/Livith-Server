import { Module } from '@nestjs/common';
import { SetlistController } from './setlist.controller';
import { SetlistService } from './setlist.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [SetlistController],
  providers: [SetlistService, PrismaService],
})
export class SetlistModule {}
