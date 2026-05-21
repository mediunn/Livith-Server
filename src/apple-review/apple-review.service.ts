import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as fs from 'fs';

@Injectable()
export class AppleReviewService {
  constructor(private configService: ConfigService) {}

  private readonly logger = new Logger(AppleReviewService.name);

  // 앱스토어 앱 ID
  private readonly appId = this.configService.get<string>('APPLE_APP_ID')!;
  // 디스코드 웹훅
  private readonly webhookUrl = this.configService.get<string>(
    'DISCORD_APP_STORE_REVIEW_WEBHOOK_URL',
  )!;

  // 마지막 리뷰 저장 파일
  private readonly cacheFile = 'last-review.json';

  @Cron('0 */5 * * * *') // 5분마다
  async checkReviews() {
    try {
      const url = `https://itunes.apple.com/kr/rss/customerreviews/id=${this.appId}/sortBy=mostRecent/json`;

      const response = await axios.get(url);

      const entries = response.data.feed.entry;

      if (!entries) return;

      let latestReview: any;
      if (Array.isArray(entries)) {
        if (entries.length < 2) return;
        latestReview = entries[1];
      } else {
        latestReview = entries;
      }

      const reviewId = latestReview.id.label;

      const lastSavedId = this.getLastReviewId();

      // 이미 보낸 리뷰면 종료
      if (reviewId === lastSavedId) {
        return;
      }

      const author = latestReview.author.name.label;
      const rating = latestReview['im:rating'].label;
      const title = latestReview.title.label;
      const content = latestReview.content.label;
      const version = latestReview['im:version'].label;

      // 디코 전송
      await axios.post(this.webhookUrl, {
        content:
          `⭐ 새로운 App Store 리뷰\n\n` +
          `👤 작성자: ${author}\n` +
          `⭐ 평점: ${rating}\n` +
          `📦 버전: ${version}\n` +
          `📝 제목: ${title}\n\n` +
          `${content}`,
      });

      // 마지막 리뷰 저장
      fs.writeFileSync(this.cacheFile, JSON.stringify({ reviewId }));

      this.logger.log('새 리뷰 알림 전송 완료');
    } catch (error) {
      this.logger.error(error);
    }
  }

  private getLastReviewId(): string | null {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));

      return data.reviewId;
    } catch {
      return null;
    }
  }
}
