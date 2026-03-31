import { SwrCache } from './swr-cache.util';

describe('SwrCache', () => {
  let cache: SwrCache<string>;

  beforeEach(() => {
    cache = new SwrCache<string>();
  });

  describe('get', () => {
    it('캐시가 없으면 null 반환', () => {
      expect(cache.get('missing')).toBeNull();
    });

    it('fresh 기간 내에는 isStale: false로 반환', () => {
      cache.set('key', 'value', { ttl: 10_000, stateTtl: 10_000 });

      const result = cache.get('key');

      expect(result).not.toBeNull();
      expect(result!.data).toBe('value');
      expect(result!.isStale).toBe(false);
    });

    it('ttl 경과 후 stateTtl 이내면 isStale: true로 반환', () => {
      const now = Date.now();
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set 시점
        .mockReturnValueOnce(now + 6_000); // get 시점 (ttl 5초 경과)

      cache.set('key', 'value', { ttl: 5_000, stateTtl: 10_000 });

      const result = cache.get('key');

      expect(result).not.toBeNull();
      expect(result!.isStale).toBe(true);

      jest.restoreAllMocks();
    });

    it('ttl + stateTtl 모두 경과하면 null 반환 (evict)', () => {
      const now = Date.now();
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now) // set 시점
        .mockReturnValueOnce(now + 16_000); // get 시점 (ttl 5초 + stateTtl 10초 초과)

      cache.set('key', 'value', { ttl: 5_000, stateTtl: 10_000 });

      expect(cache.get('key')).toBeNull();

      jest.restoreAllMocks();
    });

    it('evict 후 size가 줄어듦', () => {
      const now = Date.now();
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 16_000);

      cache.set('key', 'value', { ttl: 5_000, stateTtl: 10_000 });
      expect(cache.size()).toBe(1);

      cache.get('key'); // evict 트리거

      expect(cache.size()).toBe(0);
      jest.restoreAllMocks();
    });
  });

  describe('delete', () => {
    it('수동 삭제 후 null 반환', () => {
      cache.set('key', 'value', { ttl: 10_000, stateTtl: 10_000 });
      cache.delete('key');

      expect(cache.get('key')).toBeNull();
    });
  });

  describe('size', () => {
    it('set한 개수만큼 size 반환', () => {
      cache.set('a', '1', { ttl: 10_000, stateTtl: 10_000 });
      cache.set('b', '2', { ttl: 10_000, stateTtl: 10_000 });

      expect(cache.size()).toBe(2);
    });

    it('같은 key로 덮어쓰면 size 유지', () => {
      cache.set('a', '1', { ttl: 10_000, stateTtl: 10_000 });
      cache.set('a', '2', { ttl: 10_000, stateTtl: 10_000 });

      expect(cache.size()).toBe(1);
      expect(cache.get('a')!.data).toBe('2');
    });
  });
});
