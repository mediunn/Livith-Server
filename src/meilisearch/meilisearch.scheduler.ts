import { Injectable, Logger } from '@nestjs/common';
import { ConcertArtistIndexService } from './concert-artist-index.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class MeilisearchScheduler {
  private readonly logger = new Logger(MeilisearchScheduler.name);

  constructor(private readonly concertArtistIndex: ConcertArtistIndexService) {}

  // 매주 월요일 13:00 KST — INSERT한 아티스트를 색인에 흡수
  @Cron('0 13 * * 1', { timeZone: 'Asia/Seoul' })
  async resyncConcertArtists() {
    const count = await this.concertArtistIndex.bulkUpsertAll();
    this.logger.log(`weekly concert-artists resync: ${count}건`);
  }
}
