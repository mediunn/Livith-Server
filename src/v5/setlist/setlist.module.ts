import { Module } from '@nestjs/common';
import { SetlistController } from './setlist.controller.js';
import { SetlistService } from './setlist.service.js';
import { PrismaService } from '../../../prisma-v5/prisma.service.js';

@Module({
  controllers: [SetlistController],
  providers: [SetlistService, PrismaService],
})
export class SetlistModule {}
