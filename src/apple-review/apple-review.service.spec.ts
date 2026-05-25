import { Test, TestingModule } from '@nestjs/testing';
import { AppleReviewService } from './apple-review.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';

jest.mock('axios');
jest.mock('fs');

describe('AppleReviewService', () => {
  let service: AppleReviewService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedFs = fs as jest.Mocked<typeof fs>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockedFs.writeFileSync.mockImplementation(() => undefined as any);
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.readFileSync.mockImplementation(() => '{}' as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppleReviewService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, string> = {
                APPLE_APP_ID: '6745769826',
                DISCORD_APP_STORE_REVIEW_WEBHOOK_URL:
                  'https://example.test/webhook',
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

  it('sends the latest review when there is no saved id', async () => {
    // mock RSS response with app metadata first + two reviews (mostRecent first)
    mockedAxios.get.mockResolvedValue({
      data: {
        feed: {
          entry: [
            { id: { label: 'app' } },
            {
              id: { label: 'r2' },
              author: { name: { label: 'user2' } },
              'im:rating': { label: '4' },
              'im:version': { label: '1.1' },
              title: { label: 't2' },
              content: { label: 'c2' },
            },
            {
              id: { label: 'r1' },
              author: { name: { label: 'user1' } },
              'im:rating': { label: '5' },
              'im:version': { label: '1.0' },
              title: { label: 't1' },
              content: { label: 'c1' },
            },
          ],
        },
      },
    } as any);

    // no saved id -> send all reviews (chronological order)
    jest.spyOn(service as any, 'getLastReviewId').mockReturnValue(null);
    mockedAxios.post.mockResolvedValue({ status: 204 } as any);

    await service.checkReviews();

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    const firstPayload = mockedAxios.post.mock.calls[0][1] as any;
    const secondPayload = mockedAxios.post.mock.calls[1][1] as any;

    const firstFields = firstPayload.embeds[0].fields as any[];
    const secondFields = secondPayload.embeds[0].fields as any[];

    // chronological: older review (r1 -> user1) should be sent first
    expect(firstFields.find((f) => f.name === '작성자')?.value).toBe('user1');
    expect(secondFields.find((f) => f.name === '작성자')?.value).toBe('user2');
  });

  it('sends all unread reviews after the saved id in chronological order', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        feed: {
          entry: [
            { id: { label: 'app' } },
            {
              id: { label: 'r4' },
              author: { name: { label: 'user4' } },
              'im:rating': { label: '5' },
              'im:version': { label: '1.4' },
              title: { label: 't4' },
              content: { label: 'c4' },
            },
            {
              id: { label: 'r3' },
              author: { name: { label: 'user3' } },
              'im:rating': { label: '4' },
              'im:version': { label: '1.3' },
              title: { label: 't3' },
              content: { label: 'c3' },
            },
            {
              id: { label: 'r2' },
              author: { name: { label: 'user2' } },
              'im:rating': { label: '3' },
              'im:version': { label: '1.2' },
              title: { label: 't2' },
              content: { label: 'c2' },
            },
            {
              id: { label: 'r1' },
              author: { name: { label: 'user1' } },
              'im:rating': { label: '2' },
              'im:version': { label: '1.1' },
              title: { label: 't1' },
              content: { label: 'c1' },
            },
          ],
        },
      },
    } as any);

    jest.spyOn(service as any, 'getLastReviewId').mockReturnValue('r2');
    mockedAxios.post.mockResolvedValue({ status: 204 } as any);

    await service.checkReviews();

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    const firstPayload = mockedAxios.post.mock.calls[0][1] as any;
    const secondPayload = mockedAxios.post.mock.calls[1][1] as any;

    const firstFields = firstPayload.embeds[0].fields as any[];
    const secondFields = secondPayload.embeds[0].fields as any[];

    expect(firstFields.find((f) => f.name === '작성자')?.value).toBe('user3');
    expect(secondFields.find((f) => f.name === '작성자')?.value).toBe('user4');
  });
});
