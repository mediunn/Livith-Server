import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ConcertRequestDiscordService } from './concert-request-discord.service';

jest.mock('axios');

describe('ConcertRequestDiscordService', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  let service: ConcertRequestDiscordService;
  let configGet: jest.Mock;

  const payload = {
    id: 1,
    userId: 10,
    userNickname: '테스트유저',
    concertTitle: '테일러 스위프트 콘서트',
    url: 'https://www.example.com/concert/1',
    requestContent: '아티스트명: 테일러 스위프트',
    autoRegister: true,
  };

  beforeEach(() => {
    configGet = jest.fn();
    service = new ConcertRequestDiscordService({
      get: configGet,
    } as unknown as ConfigService);
    jest.clearAllMocks();
  });

  it('웹훅 URL이 없으면 axios를 호출하지 않아야 함', async () => {
    // Given
    configGet.mockReturnValue(undefined);

    // When
    await service.notifyConcertRequest(payload);

    // Then
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('웹훅 URL이 있으면 포럼 thread_name과 embed로 전송해야 함', async () => {
    // Given
    const webhookUrl = 'https://discord.com/api/webhooks/test';
    configGet.mockReturnValue(webhookUrl);
    mockedAxios.post.mockResolvedValue({ status: 204 } as any);

    // When
    await service.notifyConcertRequest(payload);

    // Then
    expect(mockedAxios.post).toHaveBeenCalledWith(
      webhookUrl,
      expect.objectContaining({
        thread_name: `[콘서트 요청] ${payload.concertTitle}`,
        embeds: [
          expect.objectContaining({
            title: '콘서트 정보 요청',
            fields: expect.arrayContaining([
              { name: '요청 ID', value: '1', inline: true },
              { name: '유저 ID', value: '10', inline: true },
              {
                name: '유저 닉네임',
                value: payload.userNickname,
                inline: true,
              },
              { name: '자동 등록 여부', value: true, inline: true },
              {
                name: '콘서트명',
                value: payload.concertTitle,
                inline: false,
              },
              { name: 'URL', value: payload.url, inline: false },
              {
                name: '추가 요청',
                value: payload.requestContent,
                inline: false,
              },
            ]),
          }),
        ],
      }),
      { timeout: 5000 },
    );
  });

  it('디스코드 전송 실패해도 예외를 던지지 않아야 함', async () => {
    // Given
    configGet.mockReturnValue('https://discord.com/api/webhooks/test');
    mockedAxios.post.mockRejectedValue(new Error('network error'));

    // When & Then
    await expect(
      service.notifyConcertRequest(payload),
    ).resolves.toBeUndefined();
  });
});
