import { Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from '../common/constants/api-prefix';
import { MeilisearchService } from './meilisearch.service';
import { ConcertArtistIndexService } from './concert-artist-index.service';

@ApiTags('Meilisearch')
@Controller(`${API_PREFIX}/meilisearch`)
export class MeilisearchController {
  private readonly logger = new Logger(MeilisearchController.name);

  constructor(
    private readonly meilisearchService: MeilisearchService,
    private readonly concertArtistIndexService: ConcertArtistIndexService,
  ) {}

  @ApiOperation({
    summary: '아티스트 인덱스 수동 재색인',
    description:
      'representative_artists 테이블 아티스트 이름을 Meilisearch에 push',
  })
  @Post('/reindex')
  async reindex() {
    this.logger.log('Manual Meilisearch reindex triggered');
    const count = await this.meilisearchService.bulkUpsertAll();
    return { success: true, count };
  }

  @ApiOperation({
    summary: '콘서트 아티스트 인덱스 수동 재색인',
    description:
      'artists 테이블(searchNames+공백변형 포함)을 concert-artists 인덱스에 push',
  })
  @Post('/reindex-concert-artists')
  async reindexConcertArtists() {
    this.logger.log('Manual concert-artists reindex triggered');
    const count = await this.concertArtistIndexService.bulkUpsertAll();
    return { success: true, count };
  }
}
