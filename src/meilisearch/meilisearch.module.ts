import { Global, Module } from '@nestjs/common';
import { MeilisearchService } from './meilisearch.service';
import { MeilisearchController } from './meilisearch.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [MeilisearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class MeilisearchModule {}
