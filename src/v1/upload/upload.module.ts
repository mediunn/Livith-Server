import { Module } from '@nestjs/common';
import { CultureUploadService } from './culture-upload.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SetlistUploadService } from './setlist-upload.service';
import { ConcertSetlistUploadService } from './concert-setlist-upload.service';
import { SongUploadService } from './song-upload.service';
import { SetlistSongsUploadService } from './setlist-song-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [
    CultureUploadService,
    SetlistUploadService,
    ConcertSetlistUploadService,
    SongUploadService,
    SetlistSongsUploadService,
  ],
  exports: [
    CultureUploadService,
    SetlistUploadService,
    ConcertSetlistUploadService,
    SongUploadService,
    SetlistSongsUploadService,
  ],
})
export class UploadModule {}
