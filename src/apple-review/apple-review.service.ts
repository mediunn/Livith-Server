import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as fs from 'fs';

const DISCORD_EMBED_COLOR = 0x58b9ff;

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

  @Cron('0 */15 * * * *') // 15분마다
  async checkReviews() {
    try {
      const url = `https://itunes.apple.com/kr/rss/customerreviews/id=${this.appId}/sortBy=mostRecent/json`;

      const resp = await this.fetchFeedWithFallback(url);
      const lastSavedId = this.getLastReviewId();
      const reviews = this.getReviewsFromResponse(resp.data.feed.entry);

      if (reviews.length === 0) return;

      let reviewsToSend: any[];
      if (!lastSavedId) {
        reviewsToSend = reviews.slice().reverse();
      } else {
        const savedIndex = reviews.findIndex(
          (review) => review.id.label === lastSavedId,
        );
        if (savedIndex === -1) {
          reviewsToSend = reviews.slice().reverse();
        } else {
          reviewsToSend = reviews.slice(0, savedIndex).reverse();
        }
      }

      if (reviewsToSend.length === 0) {
        return;
      }

      for (const review of reviewsToSend) {
        const author = review.author.name.label;
        const rating = review['im:rating'].label;
        const title = review.title.label;
        const content = review.content.label;
        const version = review['im:version'].label;

        // 디코 전송 (embed)
        await axios.post(
          this.webhookUrl,
          {
            username: 'Livith 앱 리뷰 알림',
            embeds: [
              {
                title: `⭐ 새로운 App Store 리뷰`,
                color: DISCORD_EMBED_COLOR,
                fields: [
                  { name: '작성자', value: author, inline: true },
                  { name: '평점', value: rating, inline: true },
                  { name: '버전', value: version, inline: true },
                  { name: '제목', value: title, inline: false },
                  { name: '내용', value: content, inline: false },
                ],
                timestamp: new Date().toISOString(),
              },
            ],
          },
          { timeout: 3000 },
        );
      }

      // 마지막 리뷰 저장
      fs.writeFileSync(
        this.cacheFile,
        JSON.stringify({ reviewId: reviews[0].id.label }),
      );

      this.logger.log('새 리뷰 알림 전송 완료');
    } catch (error) {
      this.logger.error(error);
    }
  }

  private getReviewsFromResponse(entries: any): any[] {
    if (!entries) {
      return [];
    }

    if (Array.isArray(entries)) {
      const firstId = entries[0]?.id?.label;
      if (typeof firstId === 'string' && /^\d+$/.test(firstId)) {
        return entries;
      }

      return entries.slice(1);
    }

    return [entries];
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

  private async fetchFeedWithFallback(url: string) {
    let resp = await axios.get(url);

    const hasEntries = resp?.data?.feed && resp.data.feed.entry;
    if (hasEntries) return resp;

    try {
      resp = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        },
      });
    } catch (e) {
      return resp;
    }

    return resp;
  }
}
