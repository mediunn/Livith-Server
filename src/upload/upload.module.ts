import { Module } from '@nestjs/common';
import { CultureUploadService } from './culture-upload.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SetlistUploadService } from './setlist-upload.service';
import { ConcertSetlistUploadService } from './concert-setlist-upload.service';
import { SongUploadService } from './song-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [
    CultureUploadService,
    SetlistUploadService,
    ConcertSetlistUploadService,
    SongUploadService,
  ],
  exports: [
    CultureUploadService,
    SetlistUploadService,
    ConcertSetlistUploadService,
    SongUploadService,
  ],
})
export class UploadModule {}
