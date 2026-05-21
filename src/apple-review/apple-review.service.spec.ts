import { Test, TestingModule } from '@nestjs/testing';
import { AppleReviewService } from './apple-review.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';

jest.mock('axios');

describe('AppleReviewService', () => {
  let service: AppleReviewService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppleReviewService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, string> = {
                APPLE_APP_ID: '6745769826',
                DISCORD_APP_STORE_REVIEW_WEBHOOK_URL: 'https://example.test/webhook',
                DISCORD_APP_STORE_REVIEW_WEBHOOK_USERNAME: 'TestBot',
                DISCORD_APP_STORE_REVIEW_WEBHOOK_AVATAR_URL: 'https://example.test/avatar.png',
              };
              return map[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<AppleReviewService>(AppleReviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends webhook with username and avatar', async () => {
    // mock RSS response with single entry
    mockedAxios.get.mockResolvedValue({
      data: {
        feed: {
          entry: {
            id: { label: 'r1' },
            author: { name: { label: 'user' } },
            'im:rating': { label: '5' },
            'im:version': { label: '1.0' },
            title: { label: 't' },
            content: { label: 'c' },
          },
        },
      },
    } as any);

    // avoid touching fs.existsSync (non-configurable in some envs)
    jest.spyOn(service as any, 'getLastReviewId').mockReturnValue(null);
    mockedAxios.post.mockResolvedValue({ status: 204 } as any);

    await service.checkReviews();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://example.test/webhook',
      expect.objectContaining({
        username: 'TestBot',
        avatar_url: 'https://example.test/avatar.png',
        content: expect.any(String),
      }),
    );
  });
});
