import { InFlightCoalescing } from './in-flight-coalescing.util';

describe('InFlightCoalescing', () => {
  let coalescing: InFlightCoalescing;

  beforeEach(() => {
    coalescing = new InFlightCoalescing();
  });

  it('같은 key 동시 요청은 fn을 1번만 실행', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    const [r1, r2, r3] = await Promise.all([
      coalescing.wrap('key', fn),
      coalescing.wrap('key', fn),
      coalescing.wrap('key', fn),
    ]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(r3).toBe('result');
  });

  it('다른 key는 각각 fn 실행', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    await Promise.all([
      coalescing.wrap('key1', fn),
      coalescing.wrap('key2', fn),
    ]);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('완료 후 같은 key 재요청 시 fn 다시 실행', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    await coalescing.wrap('key', fn);
    await coalescing.wrap('key', fn);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('fn 실패 시 모든 대기 요청이 같은 에러로 reject', async () => {
    const error = new Error('api error');
    const fn = jest.fn().mockRejectedValue(error);

    const results = await Promise.allSettled([
      coalescing.wrap('key', fn),
      coalescing.wrap('key', fn),
    ]);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');
    expect((results[0] as PromiseRejectedResult).reason).toBe(error);
    expect((results[1] as PromiseRejectedResult).reason).toBe(error);
  });

  it('실패 후 같은 key 재요청 시 fn 다시 실행', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    await coalescing.wrap('key', fn).catch(() => {});
    const result = await coalescing.wrap('key', fn);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toBe('ok');
  });

  it('진행 중인 요청 수를 size()로 확인', async () => {
    let resolve: (v: string) => void;
    const pending = new Promise<string>((r) => {
      resolve = r;
    });
    const fn = jest.fn().mockReturnValue(pending);

    const promise = coalescing.wrap('key', fn);
    expect(coalescing.size()).toBe(1);

    resolve!('done');
    await promise;
    expect(coalescing.size()).toBe(0);
  });
});
