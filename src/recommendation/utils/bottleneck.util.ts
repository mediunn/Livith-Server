export interface BottleneckOptions {
  /** 최대 동시 실행 수(Token Bucket)*/
  maxConcurrent: number;
  /** 요청 시작 간 최소 간격 ms(Leaky Bucket) */
  minTime: number;
  /** 실패 시 최대 재시도 횟수 */
  maxRetries: number;
  /** 재시도 기본 대기 ms(지수 백오프: delay * 2^attempt) */
  retryDelay: number;
}

interface QueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

/**
 * Bottlenect: Token Bucket(동시 실행 제한) + Leaky Bucket(요청 간격 제한)
 * + Selective Retry(지수 백오프)
 */
export class Bottleneck {
  private readonly queue: QueueItem[] = [];
  private running = 0;
  private lastStartTime = 0;

  constructor(private readonly options: BottleneckOptions) {}

  schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.drain();
    });
  }

  private drain(): void {
    if (this.running >= this.options.maxConcurrent) return;
    if (this.queue.length === 0) return;

    const wait = this.options.minTime - (Date.now() - this.lastStartTime);
    if (wait > 0) {
      setTimeout(() => this.drain(), wait);
      return;
    }

    const item = this.queue.shift()!;
    this.running++;
    this.lastStartTime = Date.now();

    this.execute(item).finally(() => {
      this.running--;
      this.drain();
    });
  }

  private async execute(item: QueueItem): Promise<void> {
    try {
      const result = await this.runWithRetry(item.fn);
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    }
  }

  private async runWithRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= this.options.maxRetries) throw err;
      const delay = this.options.retryDelay * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      return this.runWithRetry(fn, attempt + 1);
    }
  }

  /** 대기 중인 요청 수 (디버그용) */
  pendingCount(): number {
    return this.queue.length;
  }
}
