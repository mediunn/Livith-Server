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
});
