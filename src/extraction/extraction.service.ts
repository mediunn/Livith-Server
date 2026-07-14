import { ExtractionJob, ExtractionStatus, Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { SubmitResultDto } from './dto/submit-result.dto';
import { ExtractionEventsService } from './extraction-events.service';

const TERMINAL: ExtractionStatus[] = ['MATCHED', 'NO_MATCH'];
type ClientResult = 'MATCHED' | 'NO_MATCH';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private readonly WAIT_MS = 50_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: ExtractionEventsService,
  ) {}

  /**
   * 잡 생성(멱등)
   * 같은 URL의 최신 잡이 있으면 상태 무관 재사용.
   * - 진행 중(PENDING/EXTRACTING)이면 그 대기에 합류
   * - 종결(MATCHED/NO_MATCH)이면 캐시된 결과 반환(재추출 안 함).
   *   추출값은 게시물이 안 바뀌니 동일하고, 못 찾은 공연은 요청/fulfill 플로우가 담당.
   */
  async createJob(instagramUrl: string): Promise<ExtractionJob> {
    const existing = await this.prisma.extractionJob.findFirst({
      where: { instagramUrl },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;

    return this.prisma.extractionJob.create({ data: { instagramUrl } });
  }

  async findById(jobId: string): Promise<ExtractionJob> {
    const job = await this.prisma.extractionJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException(ErrorCode.EXTRACTION_JOB_NOT_FOUND);
    return job;
  }

  /**
   * 홈워커 claim. PENDING 1건을 원자적으로 EXTRACTING 전이
   * 재할당 및 동시 워커와 레이스 방지
   */
  async claimNext(): Promise<{ jobId: string; instagramUrl: string } | null> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        { id: string; instagram_url: string }[]
      >(Prisma.sql`
        SELECT id, instagram_url
          FROM extraction_jobs
          WHERE status = 'PENDING'
        ORDER BY created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `);

      if (rows.length === 0) return null;

      const { id, instagram_url } = rows[0];
      // SELECT ... FOR UPDATE SKIP LOCKED 는 Prisma 표현 불가라 raw 유지,
      // 전이 UPDATE 는 Prisma 로 처리(타입 안정성 + @updatedAt 자동)
      await tx.extractionJob.update({
        where: { id },
        data: { status: 'EXTRACTING' },
      });
      return { jobId: id, instagramUrl: instagram_url };
    });
  }

  /**
   * 추출 결과 제출 -> 매칭 -> status 확정.
   * 멱등: EXTRACTING 아니면 그대로 반환
   */
  async submitResult(
    jobId: string,
    dto: SubmitResultDto,
  ): Promise<ExtractionJob> {
    const job = await this.findById(jobId);
    if (job.status !== 'EXTRACTING') return job;

    // TODO: 매칭 -> candidates + status(MATCHED/NO_MATCH)
    const updated = await this.prisma.extractionJob.update({
      where: { id: jobId },
      data: {
        status: 'NO_MATCH',
        resultPayload: {
          extracted: dto as unknown as Prisma.InputJsonValue,
          candidates: [],
        },
      },
    });
    this.events.notifyDone(jobId);
    return updated;
  }

  /**
   * 추출 실패 보고
   * 원인은 로그로만
   */
  async reportFail(jobId: string, reason?: string): Promise<ExtractionJob> {
    const job = await this.findById(jobId);
    if (job.status !== 'EXTRACTING') return job;

    this.logger.warn(`extraction job ${jobId} failed: ${reason ?? 'unknown'}`);
    const updated = await this.prisma.extractionJob.update({
      where: { id: jobId },
      data: { status: 'NO_MATCH' },
    });
    this.events.notifyDone(jobId);
    return updated;
  }

  /**
   * 클라 진입점: 잡 생성(멱등) -> 완료까지 대기 -> 결과 매칭
   * 이미 종결이면 즉시, 아니면 최대 WAIT_MS 대기
   */
  async createAndWait(
    instagramUrl: string,
  ): Promise<{ result: ClientResult; concerts: any[] }> {
    const job = await this.createJob(instagramUrl);

    // 종결 전이면 대기(구독 먼저 걸고 -> 대기)
    // 구독 직후 DB 재확인으로 리스너 등록 전 notifyDone 유실 레이스 방어
    let current = job;
    if (!TERMINAL.includes(current.status)) {
      await this.events.waitForDone(job.id, this.WAIT_MS, async () => {
        const latest = await this.findById(job.id);
        return TERMINAL.includes(latest.status);
      });
      current = await this.findById(job.id);
    }

    return this.toClientResponse(current);
  }

  /** DB status -> 클라 result 3종 + concerts 매핑 */
  private toClientResponse(job: ExtractionJob): {
    result: ClientResult;
    concerts: any[];
  } {
    if (job.status === 'MATCHED') {
      return { result: 'MATCHED', concerts: [] };
    }
    return { result: 'NO_MATCH', concerts: [] };
  }
}
