import { Module } from '@nestjs/common';
import { CultureUploadService } from './culture-upload.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SetlistUploadService } from './setlist-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [CultureUploadService, SetlistUploadService],
  exports: [CultureUploadService, SetlistUploadService],
})
export class UploadModule {}
