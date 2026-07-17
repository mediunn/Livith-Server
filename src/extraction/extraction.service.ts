import {
  ConcertStatus,
  ExtractionJob,
  ExtractionStatus,
  Prisma,
} from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { SubmitResultDto } from './dto/submit-result.dto';
import { ExtractionEventsService } from './extraction-events.service';
import { ConcertArtistIndexService } from '../meilisearch/concert-artist-index.service';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getConcertDaysLeft } from '../common/utils/date.util';

const TERMINAL: ExtractionStatus[] = ['MATCHED', 'NO_MATCH'];
type ClientResult = 'MATCHED' | 'NO_MATCH';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);
  private readonly WAIT_MS = 30_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: ExtractionEventsService,
    private readonly concertArtistIndex: ConcertArtistIndexService,
  ) {}

  /**
   * 잡 생성(멱등)
   * 같은 URL의 최신 잡이 있으면 상태 무관 재사용.
   * - 진행 중(PENDING/EXTRACTING)이면 그 대기에 합류
   * - 종결(MATCHED/NO_MATCH)이면 캐시된 결과 반환(재추출 안 함).
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

    const candidateIds = await this.matchConcertIds(dto.artist);
    const status: ExtractionStatus =
      candidateIds.length > 0 ? 'MATCHED' : 'NO_MATCH';

    const updated = await this.prisma.extractionJob.update({
      where: { id: jobId },
      data: {
        status,
        resultPayload: {
          extracted: dto as unknown as Prisma.InputJsonValue,
          candidates: candidateIds,
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
  ): Promise<{ result: ClientResult; concerts: ConcertResponseDto[] }> {
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

  /**
   * 예산(WAIT_MS) 소진한 미종결 잡을 NO_MATCH로 종결.
   */
  async expireOverdueJobs(): Promise<void> {
    const now = new Date();
    const budgetCutoff = new Date(now.getTime() - this.WAIT_MS);

    const expired = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE extraction_jobs
        SET status = 'NO_MATCH', updated_at = ${now}
      WHERE status IN ('PENDING', 'EXTRACTING')
        AND created_at < ${budgetCutoff}
    `);
    if (expired > 0) {
      this.logger.warn(`extraction jobs expired to NO_MATCH: ${expired}건`);
    }
  }

  /**
   * 종결(MATCHED/NO_MATCH) 후 7일 지난 잡 삭제.
   */
  async cleanupOldJobs(): Promise<number> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const affected = await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM extraction_jobs
        WHERE status IN ('MATCHED', 'NO_MATCH')
        AND updated_at < ${cutoff}
    `);
    if (affected > 0) {
      this.logger.log(`old extraction jobs cleaned up: ${affected}건`);
    }
    return affected;
  }

  /** DB status -> 클라 result 2종 + concerts 매핑 */
  private async toClientResponse(job: ExtractionJob): Promise<{
    result: ClientResult;
    concerts: ConcertResponseDto[];
  }> {
    if (job.status !== 'MATCHED') {
      return { result: 'NO_MATCH', concerts: [] };
    }

    const candidateIds = this.extractCandidateIds(job.resultPayload);
    if (candidateIds.length === 0) {
      return { result: 'MATCHED', concerts: [] };
    }

    const concerts = await this.prisma.concert.findMany({
      where: { id: { in: candidateIds } },
    });
    // candidates 순서(정확도/공연일 순) 보존
    const byId = new Map(concerts.map((c) => [c.id, c]));
    const ordered = candidateIds
      .map((id) => byId.get(id))
      .filter((c): c is (typeof concerts)[number] => Boolean(c));

    const dtos = ordered.map(
      (c) =>
        new ConcertResponseDto(c, getConcertDaysLeft(c.startDate, c.endDate)),
    );
    return { result: 'MATCHED', concerts: dtos };
  }

  /**
   * 추출된 아티스트명 -> concert-artists 인덱스 매칭 -> 진행중 + 다가올 콘서트 top3 id.
   * 못 찾거나(hits 0) 진행중 콘서트가 없으면 빈 배열(=NO_MATCH)
   */
  private async matchConcertIds(artistName?: string): Promise<number[]> {
    if (typeof artistName !== 'string' || !artistName.trim()) return [];

    const matches = await this.concertArtistIndex.matchArtist(artistName);
    const artistIds = [...new Set(matches.map((m) => m.artistId))];
    if (artistIds.length === 0) return [];

    const concerts = await this.prisma.concert.findMany({
      where: {
        artistId: { in: artistIds },
        status: { in: [ConcertStatus.ONGOING, ConcertStatus.UPCOMING] },
      },
      orderBy: [{ startDate: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
      take: 3,
      select: { id: true },
    });

    return concerts.map((c) => c.id);
  }

  /** resultPayload.candidates(number[]) 안전 파싱 */
  private extractCandidateIds(payload: Prisma.JsonValue | null): number[] {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return [];
    }
    const candidates = (payload as { candidates?: unknown }).candidates;
    return Array.isArray(candidates)
      ? candidates.filter((x): x is number => typeof x === 'number')
      : [];
  }
}
