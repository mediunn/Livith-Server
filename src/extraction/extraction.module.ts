import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExtractionController } from './extraction.controller';
import { ExtractionInternalController } from './extraction-internal.controller';
import { ExtractionService } from './extraction.service';
import { ExtractionEventsService } from './extraction-events.service';
import { ExtractionScheduler } from './extraction.scheduler';

@Module({
  imports: [PrismaModule],
  controllers: [ExtractionController, ExtractionInternalController],
  providers: [ExtractionService, ExtractionEventsService, ExtractionScheduler],
})
export class ExtractionModule {}
