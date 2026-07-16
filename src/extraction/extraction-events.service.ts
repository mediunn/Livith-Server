import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ExtractionEventsService {
  private readonly logger = new Logger(ExtractionEventsService.name);

  constructor(private readonly emitter: EventEmitter2) {}

  private key(jobId: string) {
    return `extraction-job.done.${jobId}`;
  }

  /**
   * 잡 완료까지 대기. timeout 안에 done 이벤트 없으면 그냥 resolve.
   *
   * 리스너 등록 전에 notifyDone이 먼저 발생하면 이벤트가 유실되어
   * timeoutMs를 꽉 채우는 레이스가 있다. 리스너를 건 직후 checkAlreadyDone으로
   * DB 상태를 재확인해 이미 종결이면 즉시 해제한다(subscribe-then-recheck).
   */
  async waitForDone(
    jobId: string,
    timeoutMs: number,
    checkAlreadyDone?: () => Promise<boolean>,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const onDone = () => {
        clearTimeout(timer);
        this.emitter.off(this.key(jobId), onDone);
        resolve();
      };
      const timer = setTimeout(onDone, timeoutMs);

      this.emitter.once(this.key(jobId), onDone);

      if (!checkAlreadyDone) return;
      checkAlreadyDone()
        .then((done) => {
          if (done) onDone();
        })
        .catch((err) => {
          // 재확인 실패는 치명적이지 않음: 이벤트/타임아웃 대기로 폴백
          this.logger.debug(
            `waitForDone recheck failed for ${jobId}, fallback to wait: ${err?.message}`,
          );
        });
    });
  }

  /** 대기 중인 요청 깨우기 */
  notifyDone(jobId: string) {
    this.emitter.emit(this.key(jobId));
  }
}
