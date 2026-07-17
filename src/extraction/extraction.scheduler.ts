import { Injectable, Logger } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExtractionScheduler {
  private readonly logger = new Logger(ExtractionScheduler.name);

  constructor(private readonly extractionService: ExtractionService) {}

  // 예산 소진 잡 종결. 클라 응답은 waitForDone 타임아웃이 책임지므로 주기는 느슨해도 된다
  @Cron(CronExpression.EVERY_30_SECONDS)
  async expireOverdueJobs() {
    await this.extractionService.expireOverdueJobs();
  }

  // 매일 04:00 KST: 종결 후 7일 지난 잡 삭제
  @Cron('0 4 * * *', { timeZone: 'Asia/Seoul' })
  async cleanupOldJobs() {
    await this.extractionService.cleanupOldJobs();
  }
}
