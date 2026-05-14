import { Module } from '@nestjs/common';
import { SetlistController } from './setlist.controller';
import { SetlistService } from './setlist.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SetlistController],
  providers: [SetlistService],
})
export class SetlistModule {}
