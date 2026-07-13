import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ExtractionEventsService {
  constructor(private readonly emitter: EventEmitter2) {}

  private key(jobId: string) {
    return `extraction-job.done.${jobId}`;
  }

  /** 잡 완료까지 대기. timeout 안에 done 이벤트 없으면 그냥 resolve. */
  async waitForDone(jobId: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const onDone = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        this.emitter.off(this.key(jobId), onDone);
        resolve();
      }, timeoutMs);

      this.emitter.once(this.key(jobId), onDone);
    });
  }

  /** 대기 중인 요청 깨우기 */
  notifyDone(jobId: string) {
    this.emitter.emit(this.key(jobId));
  }
}
