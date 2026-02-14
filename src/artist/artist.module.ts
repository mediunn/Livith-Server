import { Module } from '@nestjs/common';
import { ArtistMatchingService } from './service/artist-matching.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ArtistMatchingService],
  exports: [ArtistMatchingService],
})
export class ArtistModule {}
