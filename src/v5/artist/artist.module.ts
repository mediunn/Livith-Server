import { Module } from '@nestjs/common';
import { ArtistMatchingService } from './service/artist-matching.service';
import { PrismaService } from '../../../prisma-v5/prisma.service';

@Module({
  providers: [ArtistMatchingService, PrismaService],
  exports: [ArtistMatchingService],
})
export class ArtistModule {}
