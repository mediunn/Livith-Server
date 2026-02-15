import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

export enum YoutubeApiErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}

export interface YoutubApiResult {
  imgUrl: string | null;
  errorType?: YoutubeApiErrorType;
}

@Injectable()
export class YoutubeApiService {
  private readonly logger = new Logger(YoutubeApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY');

    if (!this.apiKey) {
      this.logger.warn('YOUTUBE_API_KEY is not set');
    }
  }

  async getArtistImageUrl(artistName: string): Promise<YoutubApiResult> {
    try {
      const params = {
        part: 'snippet',
        q: `${artistName} official`,
        type: 'channel',
        maxResults: 1,
        key: this.apiKey,
      };

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/search`, { params, timeout: 0 }),
      );

      const items = response.data.items || [];
      if (items.length === 0) return { imgUrl: null };

      const thumbnails = items[0].snippet?.thumbnails;
      return { imgUrl: thumbnails?.high?.url || null };
    } catch (error) {
      if (this.isQuotaExceeded(error)) {
        return { imgUrl: null, errorType: YoutubeApiErrorType.QUOTA_EXCEEDED };
      }
      return { imgUrl: null };
    }
  }

  private isQuotaExceeded(error: any): boolean {
    if (error instanceof AxiosError && error.response?.status === 403) {
      const errorData = error.response.data;
      if (errorData?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        return true;
      }
    }
    return false;
  }
}
