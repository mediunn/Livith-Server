/**
 * In-Flight Coalescing
 *
 * 동일 key로 동시에 N개 요청이 들어오면 -> HTTP 호출 1개만 실행,
 * 나머지는 같은 Promise를 공유해서 결과를 받음
 */
export class InFlightCoalescing {
  private readonly inFlight = new Map<string, Promise<any>>();

  async wrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = fn().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  /** 진행 중인 요청 수(디버그용) */
  size(): number {
    return this.inFlight.size;
  }
}
