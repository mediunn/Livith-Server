import { Module } from '@nestjs/common';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SongController],
  providers: [SongService],
})
export class SongModule {}
