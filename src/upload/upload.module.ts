import { Module } from '@nestjs/common';
import { CultureUploadService } from './culture-upload.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SetlistUploadService } from './setlist-upload.service';
import { ConcertSetlistUploadService } from './concert-setlist-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [
    CultureUploadService,
    SetlistUploadService,
    ConcertSetlistUploadService,
  ],
  exports: [
    CultureUploadService,
    SetlistUploadService,
    ConcertSetlistUploadService,
  ],
})
export class UploadModule {}
