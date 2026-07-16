import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type ConcertRequestDiscordPayload = {
  id: number;
  userId: number;
  userNickname: string;
  concertTitle: string;
  url?: string | null;
  requestContent?: string | null;
  autoRegister: boolean;
};

@Injectable()
export class ConcertRequestDiscordService {
  private readonly logger = new Logger(ConcertRequestDiscordService.name);

  constructor(private readonly configService: ConfigService) {}

  async notifyConcertRequest(
    payload: ConcertRequestDiscordPayload,
  ): Promise<void> {
    const webhookUrl = this.configService.get<string>(
      'DISCORD_CONCERT_REQUEST_WEBHOOK_URL',
    );

    if (!webhookUrl) {
      this.logger.warn(
        '디스코드 콘서트 요청 웹훅 URL이 설정되지 않아 알림 전송을 건너뜁니다.',
      );
      return;
    }

    const threadName = `[콘서트 요청] ${payload.concertTitle}`.slice(0, 100);

    const fields = [
      {
        name: '요청 ID',
        value: String(payload.id),
        inline: true,
      },
      {
        name: '유저 ID',
        value: String(payload.userId),
        inline: true,
      },
      {
        name: '유저 닉네임',
        value: payload.userNickname,
        inline: true,
      },
      {
        name: '자동 등록 여부',
        value: payload.autoRegister,
        inline: true,
      },
      {
        name: '콘서트명',
        value: payload.concertTitle,
        inline: false,
      },
    ];

    if (payload.url) {
      fields.push({
        name: 'URL',
        value:
          payload.url.length > 1024
            ? payload.url.slice(0, 1021) + '...'
            : payload.url,
        inline: false,
      });
    }
    if (payload.requestContent) {
      fields.push({
        name: '추가 요청',
        value:
          payload.requestContent.length > 1024
            ? payload.requestContent.slice(0, 1021) + '...'
            : payload.requestContent,
        inline: false,
      });
    }

    try {
      await axios.post(
        webhookUrl,
        {
          thread_name: threadName,
          embeds: [
            {
              title: '콘서트 정보 요청',
              color: 0x5865f2,
              fields,
              timestamp: new Date().toISOString(),
            },
          ],
        },
        {
          timeout: 5000,
        },
      );
    } catch (error) {
      this.logger.error(
        `콘서트 요청(ID: ${payload.id})의 디스코드 알림 전송에 실패했습니다.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
