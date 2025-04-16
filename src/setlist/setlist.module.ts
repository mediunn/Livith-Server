import { Module } from '@nestjs/common';
import { SetlistController } from './setlist.controller';
import { SetlistService } from './setlist.service';

@Module({
  controllers: [SetlistController],
  providers: [SetlistService]
})
export class SetlistModule {}
