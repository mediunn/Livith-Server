import { Injectable, Logger } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ExtractionScheduler {
  private readonly logger = new Logger(ExtractionScheduler.name);

  constructor(private readonly extractionService: ExtractionService) {}

  // 매분: 워커 사망으로 멈춘 EXTRACTING 잡 종결
  @Cron(CronExpression.EVERY_MINUTE)
  async failStaleJobs() {
    await this.extractionService.failStaleExtracting();
  }

  // 매일 04:00 KST: 오래된 잡 종결 삭제
  @Cron('0 4 * * *', { timeZone: 'Asia/Seoul' })
  async cleanupOldJobs() {
    await this.extractionService.cleanupOldJobs();
  }
}
