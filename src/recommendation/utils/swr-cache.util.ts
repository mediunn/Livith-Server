export interface SwrCacheOptions {
  /** fresh로 간주하는 기간(ms) */
  ttl: number;

  /** fresh 만료 후 state 상태로 서빙 가능한 기간(ms) */
  staleTtl: number;
}

export interface SwrCacheConfig {
  /** 최대 캐시 항목 수. 초과 시 LRU 항목 제거 (기본값: 500) */
  maxSize?: number;
}

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
  staleTtl: number;
}

/**
 * Stale-While-Revalidate 캐시
 * - age <= ttl : fresh -> 즉시 반환
 * - ttl < age <= staleTtl: stale -> 반환 + 백그라운드 재검증 트리거
 * - age > ttl + staleTtl: evict -> cache miss
 *
 * LRU 정책: get() 시 항목을 Map 끝으로 이동, maxSize 초과 시 가장 오래된 항목 제거
 */
export class SwrCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;

  constructor(config: SwrCacheConfig = {}) {
    this.maxSize = config.maxSize ?? 500;
  }

  get(key: string): { data: T; isStale: boolean } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.cachedAt;

    if (age > entry.ttl + entry.staleTtl) {
      this.store.delete(key);
      return null;
    }

    // LRU: 접근한 항목을 Map 끝으로 이동
    this.store.delete(key);
    this.store.set(key, entry);

    return { data: entry.data, isStale: age > entry.ttl };
  }

  set(key: string, data: T, options: SwrCacheOptions): void {
    // 기존 키 갱신 시 먼저 삭제 후 재삽입 (Map 끝으로 이동)
    this.store.delete(key);

    // maxSize 초과 시 가장 오래된(첫 번째) 항목 제거
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(key, {
      data,
      cachedAt: Date.now(),
      ttl: options.ttl,
      staleTtl: options.staleTtl,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }
}
