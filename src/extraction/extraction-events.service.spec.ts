import { ExtractionEventsService } from './extraction-events.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ExtractionEventsService', () => {
  let service: ExtractionEventsService;
  let emitter: EventEmitter2;

  beforeEach(() => {
    emitter = new EventEmitter2();
    service = new ExtractionEventsService(emitter);
  });

  it('notifyDone 되면 waitForDone 이 resolve 된다', async () => {
    const p = service.waitForDone('job1', 10_000);
    service.notifyDone('job1');
    await expect(p).resolves.toBeUndefined();
  });

  it('timeout 이 지나면 이벤트 없어도 resolve 된다', async () => {
    jest.useFakeTimers();
    const p = service.waitForDone('job1', 5_000);
    jest.advanceTimersByTime(5_000);
    await expect(p).resolves.toBeUndefined();
    jest.useRealTimers();
  });

  it('리스너 등록 전에 완료됐어도 checkAlreadyDone 재확인으로 즉시 resolve 된다', async () => {
    // notifyDone 이 리스너 등록 전에 지나가 이벤트가 유실된 상황을 흉내
    const checkAlreadyDone = jest.fn().mockResolvedValue(true);
    const p = service.waitForDone('job1', 10_000, checkAlreadyDone);
    await expect(p).resolves.toBeUndefined();
    expect(checkAlreadyDone).toHaveBeenCalledTimes(1);
  });

  it('checkAlreadyDone 이 미완료면 이벤트를 계속 기다린다', async () => {
    const checkAlreadyDone = jest.fn().mockResolvedValue(false);
    const p = service.waitForDone('job1', 10_000, checkAlreadyDone);
    let resolved = false;
    void p.then(() => {
      resolved = true;
    });
    await Promise.resolve(); // 마이크로태스크 flush
    expect(resolved).toBe(false);

    service.notifyDone('job1'); // 나중에 도착한 이벤트로 해제
    await expect(p).resolves.toBeUndefined();
  });

  it('다른 jobId 이벤트에는 반응하지 않는다', async () => {
    jest.useFakeTimers();
    const p = service.waitForDone('job1', 5_000);

    service.notifyDone('job2'); // 다른 잡 → job1 대기 안 풀려야 함
    let resolved = false;
    void p.then(() => {
      resolved = true;
    });
    await Promise.resolve(); // 마이크로태스크 flush
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(5_000); // timeout 으로만 resolve
    await p;
    jest.useRealTimers();
  });

  describe('prepareWaitCreated (subscribe-then-act)', () => {
    it('구독 후에 발생한 생성 이벤트로 wait 가 즉시 resolve 된다', async () => {
      const waiter = service.prepareWaitCreated();
      const p = waiter.wait(10_000);
      service.notifyCreated();
      await expect(p).resolves.toBeUndefined();
      waiter.cleanup();
    });

    it('wait 시작 전(구독 후)에 이미 발생한 이벤트도 놓치지 않는다', async () => {
      // 구독(prepare) ~ wait 사이에 emit 이 끼어든 상황: 유실 없이 즉시 resolve 돼야 함
      const waiter = service.prepareWaitCreated();
      service.notifyCreated();
      await expect(waiter.wait(10_000)).resolves.toBeUndefined();
      waiter.cleanup();
    });

    it('이벤트 없으면 timeout 으로 resolve 된다', async () => {
      jest.useFakeTimers();
      const waiter = service.prepareWaitCreated();
      const p = waiter.wait(5_000);
      jest.advanceTimersByTime(5_000);
      await expect(p).resolves.toBeUndefined();
      waiter.cleanup();
      jest.useRealTimers();
    });

    it('cleanup 후에는 리스너가 남지 않는다', () => {
      const waiter = service.prepareWaitCreated();
      expect(emitter.listenerCount('extraction-job.created')).toBe(1);
      waiter.cleanup();
      expect(emitter.listenerCount('extraction-job.created')).toBe(0);
    });
  });
});
