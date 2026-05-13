/**
 * 페이지네이션 기반 배치 처리 유틸리티
 */
export class BatchProcessor {
  /**
   * DB에서 페이지네이션으로 데이터를 가져와 배치 처리
   */
  static async processPaginated<T>(options: {
    batchSize: number;
    fetchBatch: (skip: number, take: number) => Promise<T[]>;
    processBatch: (items: T[]) => Promise<void>;
  }): Promise<void> {
    const { batchSize, fetchBatch, processBatch } = options;
    let skip = 0;

    while (true) {
      const items = await fetchBatch(skip, batchSize);
      if (items.length === 0) break;

      await processBatch(items);
      skip += batchSize;
    }
  }

  /**
   * 메모리에 있는 배열을 청크로 나눠서 처리
   */
  static async processInChunks<T>(
    items: T[],
    chunkSize: number,
    processChunk: (chunk: T[]) => Promise<void>,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await processChunk(chunk);
    }
  }

  /**
   * 배치 처리 + 결과 집계
   */
  static async processPaginatedWithStats<T>(options: {
    batchSize: number;
    fetchBatch: (skip: number, take: number) => Promise<T[]>;
    processBatch: (items: T[]) => Promise<{ success: number; failed: number }>;
  }): Promise<{
    totalProcessed: number;
    totalSuccess: number;
    totalFailed: number;
  }> {
    const { batchSize, fetchBatch, processBatch } = options;
    let skip = 0;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    while (true) {
      const items = await fetchBatch(skip, batchSize);
      if (items.length === 0) break;

      const result = await processBatch(items);
      totalProcessed += items.length;
      totalSuccess += result.success;
      totalFailed += result.failed;
      skip += batchSize;
    }

    return { totalProcessed, totalSuccess, totalFailed };
  }
}
