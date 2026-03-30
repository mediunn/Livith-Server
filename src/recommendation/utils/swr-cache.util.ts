export interface SwrCacheOptions {
  /** fresh로 간주하는 기간(ms) */
  ttl: number;

  /** fresh 만료 후 state 상태로 서빙 가능한 기간(ms) */
  stateTtl: number;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
  stateTtl: number;
}

/**
 * Stale-While-Revalidate 캐시
 * - age <= ttl : fresh -> 즉시 반환
 * - ttl < age <= staleTtl: stale -> 반환 + 백그라운드 재검증 트리거
 * - age > ttl + staleTtl: evict -> cache miss
 */
export class SwrCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();

  get(key: string): { data: T; isStale: boolean } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.cachedAt;

    if (age > entry.ttl + entry.stateTtl) {
      this.store.delete(key);
      return null;
    }

    return { data: entry.data, isStale: age > entry.ttl };
  }

  set(key: string, data: T, options: SwrCacheOptions): void {
    this.store.set(key, {
      data,
      cachedAt: Date.now(),
      ttl: options.ttl,
      stateTtl: options.stateTtl,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }
}
