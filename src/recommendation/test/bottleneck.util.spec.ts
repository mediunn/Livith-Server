import { Bottleneck } from '../utils/bottleneck.util';

describe('Bottleneck', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('maxConcurrent', () => {
    it('동시 실행 수를 maxConcurrent로 제한', async () => {
      let running = 0;
      let maxRunning = 0;

      const bottleneck = new Bottleneck({
        maxConcurrent: 2,
        minTime: 0,
        maxRetries: 0,
        retryDelay: 0,
      });

      const fn = () =>
        new Promise<void>((resolve) => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          setTimeout(() => {
            running--;
            resolve();
          }, 50);
        });

      const promises = [
        bottleneck.schedule(fn),
        bottleneck.schedule(fn),
        bottleneck.schedule(fn),
      ];

      await jest.runAllTimersAsync();
      await Promise.all(promises);

      expect(maxRunning).toBeLessThanOrEqual(2);
    });
  });

  describe('minTime', () => {
    it('요청 시작 간격이 minTime 이상', async () => {
      const startTimes: number[] = [];

      const bottleneck = new Bottleneck({
        maxConcurrent: 1,
        minTime: 200,
        maxRetries: 0,
        retryDelay: 0,
      });

      const fn = () =>
        new Promise<void>((resolve) => {
          startTimes.push(Date.now());
          resolve();
        });

      const promises = [
        bottleneck.schedule(fn),
        bottleneck.schedule(fn),
        bottleneck.schedule(fn),
      ];

      await jest.runAllTimersAsync();
      await Promise.all(promises);

      for (let i = 1; i < startTimes.length; i++) {
        expect(startTimes[i] - startTimes[i - 1]).toBeGreaterThanOrEqual(200);
      }
    });
  });

  describe('retry', () => {
    it('실패 시 maxRetries 횟수만큼 재시도', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      const bottleneck = new Bottleneck({
        maxConcurrent: 1,
        minTime: 0,
        maxRetries: 2,
        retryDelay: 100,
      });

      // reject handler를 먼저 등록 후 타이머 실행 (unhandled rejection 방지)
      const assertion = expect(bottleneck.schedule(fn)).rejects.toThrow('fail');
      await jest.runAllTimersAsync();
      await assertion;

      // 최초 1회 + 재시도 2회 = 총 3회
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('재시도 중 성공하면 결과 반환', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('ok');

      const bottleneck = new Bottleneck({
        maxConcurrent: 1,
        minTime: 0,
        maxRetries: 2,
        retryDelay: 100,
      });

      const promise = bottleneck.schedule(fn);
      await jest.runAllTimersAsync();

      await expect(promise).resolves.toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('지수 백오프: retryDelay * 2^attempt 간격으로 재시도', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();

      const fn = jest.fn().mockImplementation(() => {
        delays.push(Date.now() - lastTime);
        lastTime = Date.now();
        return Promise.reject(new Error('fail'));
      });

      const bottleneck = new Bottleneck({
        maxConcurrent: 1,
        minTime: 0,
        maxRetries: 2,
        retryDelay: 100,
      });

      const assertion = bottleneck.schedule(fn).catch(() => {});
      await jest.runAllTimersAsync();
      await assertion;

      // 1차 재시도: 100ms, 2차 재시도: 200ms
      expect(delays[1]).toBeGreaterThanOrEqual(100);
      expect(delays[2]).toBeGreaterThanOrEqual(200);
    });

    it('maxRetries: 0이면 재시도 없이 즉시 reject', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      const bottleneck = new Bottleneck({
        maxConcurrent: 1,
        minTime: 0,
        maxRetries: 0,
        retryDelay: 0,
      });

      const assertion = expect(bottleneck.schedule(fn)).rejects.toThrow('fail');
      await jest.runAllTimersAsync();
      await assertion;

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('queue', () => {
    it('정상 실행 후 결과 반환', async () => {
      const bottleneck = new Bottleneck({
        maxConcurrent: 1,
        minTime: 0,
        maxRetries: 0,
        retryDelay: 0,
      });

      const promise = bottleneck.schedule(() => Promise.resolve('hello'));
      await jest.runAllTimersAsync();

      await expect(promise).resolves.toBe('hello');
    });

    it('대기 중인 요청 수를 pendingCount()로 확인', async () => {
      const bottleneck = new Bottleneck({
        maxConcurrent: 1,
        minTime: 0,
        maxRetries: 0,
        retryDelay: 0,
      });

      let resolveFirst: () => void;
      const blocking = new Promise<void>((r) => {
        resolveFirst = r;
      });

      bottleneck.schedule(() => blocking);
      bottleneck.schedule(() => Promise.resolve());
      bottleneck.schedule(() => Promise.resolve());

      // 첫 번째가 실행 중, 나머지 2개 대기
      expect(bottleneck.pendingCount()).toBe(2);

      resolveFirst!();
      await jest.runAllTimersAsync();
    });
  });
});
