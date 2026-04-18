import { SwrCache } from '../utils/swr-cache.util';

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
      cache.set('key', 'value', { ttl: 10_000, staleTtl: 10_000 });

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

      cache.set('key', 'value', { ttl: 5_000, staleTtl: 10_000 });

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

      cache.set('key', 'value', { ttl: 5_000, staleTtl: 10_000 });

      expect(cache.get('key')).toBeNull();

      jest.restoreAllMocks();
    });

    it('evict 후 size가 줄어듦', () => {
      const now = Date.now();
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 16_000);

      cache.set('key', 'value', { ttl: 5_000, staleTtl: 10_000 });
      expect(cache.size()).toBe(1);

      cache.get('key'); // evict 트리거

      expect(cache.size()).toBe(0);
      jest.restoreAllMocks();
    });
  });

  describe('delete', () => {
    it('수동 삭제 후 null 반환', () => {
      cache.set('key', 'value', { ttl: 10_000, staleTtl: 10_000 });
      cache.delete('key');

      expect(cache.get('key')).toBeNull();
    });
  });

  describe('LRU / maxSize', () => {
    it('maxSize 초과 시 가장 오래된 항목 제거', () => {
      const lruCache = new SwrCache<string>({ maxSize: 3 });

      lruCache.set('a', '1', { ttl: 10_000, staleTtl: 10_000 });
      lruCache.set('b', '2', { ttl: 10_000, staleTtl: 10_000 });
      lruCache.set('c', '3', { ttl: 10_000, staleTtl: 10_000 });
      lruCache.set('d', '4', { ttl: 10_000, staleTtl: 10_000 }); // a 제거됨

      expect(lruCache.size()).toBe(3);
      expect(lruCache.get('a')).toBeNull(); // 가장 오래된 항목 제거
      expect(lruCache.get('d')!.data).toBe('4');
    });

    it('get() 호출 시 LRU 순서 갱신 → 최근 접근한 항목은 제거되지 않음', () => {
      const lruCache = new SwrCache<string>({ maxSize: 3 });

      lruCache.set('a', '1', { ttl: 10_000, staleTtl: 10_000 });
      lruCache.set('b', '2', { ttl: 10_000, staleTtl: 10_000 });
      lruCache.set('c', '3', { ttl: 10_000, staleTtl: 10_000 });

      lruCache.get('a'); // a를 최근 접근으로 갱신

      lruCache.set('d', '4', { ttl: 10_000, staleTtl: 10_000 }); // b 제거됨

      expect(lruCache.get('a')!.data).toBe('1'); // a는 살아있음
      expect(lruCache.get('b')).toBeNull(); // b가 제거됨
    });

    it('기본 maxSize는 500', () => {
      const defaultCache = new SwrCache<string>();
      for (let i = 0; i < 500; i++) {
        defaultCache.set(`key${i}`, `val${i}`, {
          ttl: 10_000,
          staleTtl: 10_000,
        });
      }
      expect(defaultCache.size()).toBe(500);

      defaultCache.set('overflow', 'val', { ttl: 10_000, staleTtl: 10_000 });
      expect(defaultCache.size()).toBe(500); // 501이 되지 않음
    });
  });

  describe('size', () => {
    it('set한 개수만큼 size 반환', () => {
      cache.set('a', '1', { ttl: 10_000, staleTtl: 10_000 });
      cache.set('b', '2', { ttl: 10_000, staleTtl: 10_000 });

      expect(cache.size()).toBe(2);
    });

    it('같은 key로 덮어쓰면 size 유지', () => {
      cache.set('a', '1', { ttl: 10_000, staleTtl: 10_000 });
      cache.set('a', '2', { ttl: 10_000, staleTtl: 10_000 });

      expect(cache.size()).toBe(1);
      expect(cache.get('a')!.data).toBe('2');
    });
  });
});
