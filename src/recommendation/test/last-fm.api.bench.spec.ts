import { Observable } from 'rxjs';
import { Test } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LastfmApiService } from '../integrations/lastfm/last-fm.api.service';

const mockSimilarResponse = (artists: string[], delayMs = 0) =>
  new Observable((subscriber) => {
    setTimeout(() => {
      subscriber.next({
        data: {
          similarartists: {
            artist: artists.map((name) => ({ name })),
          },
        },
      });
      subscriber.complete();
    }, delayMs);
  });

const mockRateLimitResponse = () =>
  new Observable((subscriber) => {
    subscriber.next({
      data: { error: 29, message: 'Rate limit exceeded' },
    });
    subscriber.complete();
  });

describe('LastfmApiService 벤치마크', () => {
  let service: LastfmApiService;
  let mockGet: jest.Mock;

  beforeEach(async () => {
    mockGet = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        LastfmApiService,
        { provide: HttpService, useValue: { get: mockGet } },
        { provide: ConfigService, useValue: { get: () => 'fake-key' } },
      ],
    }).compile();

    service = module.get(LastfmApiService);
  });

  describe('SWR Cache', () => {
    it('캐시 히트는 HTTP 호출 없이 즉시 반환', async () => {
      mockGet.mockReturnValue(
        mockSimilarResponse(['Artist A', 'Artist B'], 300),
      );

      // 1회차: 콜드 (HTTP 호출 발생)
      const coldStart = Date.now();
      await service.getSimilarArtists('IU');
      const coldTime = Date.now() - coldStart;

      // 2회차: 캐시 히트 (HTTP 호출 없음)
      const cacheStart = Date.now();
      await service.getSimilarArtists('IU');
      const cacheTime = Date.now() - cacheStart;

      console.log(`콜드: ${coldTime}ms / 캐시 히트: ${cacheTime}ms`);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(cacheTime).toBeLessThan(10);
      expect(coldTime).toBeGreaterThan(200);
    }, 10000);

    it('다른 아티스트는 각각 HTTP 호출', async () => {
      mockGet.mockReturnValue(mockSimilarResponse(['Artist A'], 0));

      await service.getSimilarArtists('IU');
      await service.getSimilarArtists('BTS');

      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('InFlightCoalescing', () => {
    it('같은 아티스트 동시 요청 10개 → HTTP 1번만 호출', async () => {
      mockGet.mockReturnValue(
        mockSimilarResponse(['Artist A', 'Artist B'], 300),
      );

      const start = Date.now();
      const results = await Promise.all(
        Array.from({ length: 10 }, () => service.getSimilarArtists('IU')),
      );
      const elapsed = Date.now() - start;

      console.log(
        `동시 10개: ${elapsed}ms, HTTP 호출: ${mockGet.mock.calls.length}회`,
      );

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(elapsed).toBeLessThan(600); // 직렬이면 3000ms여야 함
      results.forEach((r) => expect(r).toEqual(['Artist A', 'Artist B']));
    }, 10000);
  });

  describe('Bottleneck Retry (rate limit)', () => {
    it('error 29 → 재시도 후 성공', async () => {
      mockGet
        .mockReturnValueOnce(mockRateLimitResponse())
        .mockReturnValueOnce(mockRateLimitResponse())
        .mockReturnValueOnce(mockSimilarResponse(['Artist A']));

      const result = await service.getSimilarArtists('IU');

      expect(mockGet).toHaveBeenCalledTimes(3);
      expect(result).toEqual(['Artist A']);
    }, 10000);

    it('error 29 → maxRetries 초과 시 빈 배열 반환', async () => {
      mockGet.mockReturnValue(mockRateLimitResponse());

      const result = await service.getSimilarArtists('IU');

      expect(mockGet).toHaveBeenCalledTimes(3); // 최초 1 + 재시도 2
      expect(result).toEqual([]);
    }, 10000);
  });

  describe('전체 레이어 시나리오', () => {
    it('5명이 동시에 같은 아티스트 요청 → 콜드 이후 캐시 히트', async () => {
      mockGet.mockReturnValue(mockSimilarResponse(['Artist A'], 300));

      // 1라운드: 동시 5명 (콜드)
      const round1Start = Date.now();
      await Promise.all(
        Array.from({ length: 5 }, () => service.getSimilarArtists('IU')),
      );
      const round1Time = Date.now() - round1Start;

      // 2라운드: 동시 5명 (캐시 히트)
      const round2Start = Date.now();
      await Promise.all(
        Array.from({ length: 5 }, () => service.getSimilarArtists('IU')),
      );
      const round2Time = Date.now() - round2Start;

      console.log(
        `1라운드(콜드): ${round1Time}ms / 2라운드(캐시): ${round2Time}ms`,
      );
      console.log(`HTTP 호출 횟수: ${mockGet.mock.calls.length}회 (기대: 1회)`);

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(round2Time).toBeLessThan(round1Time);
    }, 10000);
  });
});
