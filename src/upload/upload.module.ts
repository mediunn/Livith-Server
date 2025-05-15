import { Module } from '@nestjs/common';
import { CultureUploadService } from './culture-upload.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CultureUploadService],
  exports: [CultureUploadService],
})
export class UploadModule {}
