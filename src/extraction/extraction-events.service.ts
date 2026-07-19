import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

const CREATED_KEY = 'extraction-job.created';

@Injectable()
export class ExtractionEventsService {
  private readonly logger = new Logger(ExtractionEventsService.name);

  constructor(private readonly emitter: EventEmitter2) {}

  private doneKey(jobId: string) {
    return `extraction-job.done.${jobId}`;
  }

  /**
   * 잡 완료까지 대기. timeout 안에 done 이벤트 없으면 그냥 resolve.
   */
  async waitForDone(
    jobId: string,
    timeoutMs: number,
    checkAlreadyDone?: () => Promise<boolean>,
  ): Promise<void> {
    return this.waitFor(this.doneKey(jobId), timeoutMs, checkAlreadyDone);
  }

  /** 완료 대기 중인 요청 깨우기 */
  notifyDone(jobId: string) {
    this.emitter.emit(this.doneKey(jobId));
  }

  /**
   * 새 잡 생성까지 대기(claim 롱폴링용). 전역 이벤트라 대기 중인 워커 전원이 깨어나고,
   * 실제 잡 획득은 claim의 FOR UPDATE SKIP LOCKED가 결정한다.
   */
  async waitForCreated(
    timeoutMs: number,
    checkAlreadyCreated?: () => Promise<boolean>,
  ): Promise<void> {
    return this.waitFor(CREATED_KEY, timeoutMs, checkAlreadyCreated);
  }

  /** 생성 대기 중인 워커 깨우기 */
  notifyCreated() {
    this.emitter.emit(CREATED_KEY);
  }

  /**
   * key 이벤트까지 대기. timeout 안에 이벤트 없으면 그냥 resolve
   *
   * 리스너 등록 전에 emit이 먼저 발생하면 이벤트가 유실되어
   * timeoutMs를 꽉채우는 레이스가 있다. 리스너를 건 직후 recheck로
   * 실제 상태를 재확인해 이미 충족이면 즉시 해제한다(subscribe-then-recheck)
   */
  private async waitFor(
    key: string,
    timeoutMs: number,
    recheck?: () => Promise<boolean>,
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const onEvent = () => {
        clearTimeout(timer);
        this.emitter.off(key, onEvent);
        resolve();
      };
      const timer = setTimeout(onEvent, timeoutMs);

      this.emitter.once(key, onEvent);

      if (!recheck) return;
      recheck()
        .then((satisfied) => {
          if (satisfied) onEvent();
        })
        .catch((err) => {
          // 재확인 실패는 치명적이지 않음: 이벤트/타임아웃 대기로 폴백
          this.logger.debug(
            `waitFor(${key}) recheck failed, fallback to wait: ${err?.message}`,
          );
        });
    });
  }
}
