import { Module } from '@nestjs/common';
import { ArtistMatchingService } from './service/artist-matching.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  providers: [ArtistMatchingService, PrismaService],
  exports: [ArtistMatchingService],
})
export class ArtistModule {}
