import { Test, TestingModule } from '@nestjs/testing';
import { ExtractionService } from './extraction.service';
import { ExtractionEventsService } from './extraction-events.service';
import { ConcertArtistIndexService } from '../meilisearch/concert-artist-index.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ExtractionService', () => {
  let service: ExtractionService;
  let mockPrisma: any;
  let mockEvents: any;
  let mockConcertIndex: any;

  const baseJob = {
    id: 'job1',
    instagramUrl: 'https://www.instagram.com/p/ABC/',
    status: 'PENDING',
    resultPayload: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = {
      extractionJob: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      concert: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
    };
    mockEvents = {
      waitForDone: jest.fn().mockResolvedValue(undefined),
      notifyDone: jest.fn(),
    };
    mockConcertIndex = {
      matchArtist: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ExtractionEventsService, useValue: mockEvents },
        { provide: ConcertArtistIndexService, useValue: mockConcertIndex },
      ],
    }).compile();

    service = module.get<ExtractionService>(ExtractionService);
    jest.clearAllMocks();
  });

  describe('createJob (멱등)', () => {
    it('같은 URL 잡이 있으면 상태 무관 재사용하고 새로 만들지 않는다', async () => {
      mockPrisma.extractionJob.findFirst.mockResolvedValue(baseJob);

      const result = await service.createJob(baseJob.instagramUrl);

      expect(result).toBe(baseJob);
      expect(mockPrisma.extractionJob.create).not.toHaveBeenCalled();
      // 상태 필터 없이 URL 로만 최신 잡을 조회
      expect(mockPrisma.extractionJob.findFirst).toHaveBeenCalledWith({
        where: { instagramUrl: baseJob.instagramUrl },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('종결(NO_MATCH)된 잡도 재추출 없이 캐시 반환한다', async () => {
      const done = { ...baseJob, status: 'NO_MATCH' as const };
      mockPrisma.extractionJob.findFirst.mockResolvedValue(done);

      const result = await service.createJob(baseJob.instagramUrl);

      expect(result).toBe(done);
      expect(mockPrisma.extractionJob.create).not.toHaveBeenCalled();
    });

    it('같은 URL 잡이 없으면 새로 생성한다', async () => {
      mockPrisma.extractionJob.findFirst.mockResolvedValue(null);
      mockPrisma.extractionJob.create.mockResolvedValue(baseJob);

      const result = await service.createJob(baseJob.instagramUrl);

      expect(mockPrisma.extractionJob.create).toHaveBeenCalledWith({
        data: { instagramUrl: baseJob.instagramUrl },
      });
      expect(result).toBe(baseJob);
    });
  });

  describe('submitResult (멱등)', () => {
    it('EXTRACTING 이 아니면 업데이트/알림 없이 그대로 반환', async () => {
      mockPrisma.extractionJob.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'NO_MATCH',
      });

      const result = await service.submitResult('job1', {});

      expect(result.status).toBe('NO_MATCH');
      expect(mockPrisma.extractionJob.update).not.toHaveBeenCalled();
      expect(mockEvents.notifyDone).not.toHaveBeenCalled();
    });

    it('매칭 후보가 없으면 NO_MATCH + 빈 candidates 로 확정', async () => {
      mockPrisma.extractionJob.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'EXTRACTING',
      });
      mockConcertIndex.matchArtist.mockResolvedValue([]); // 인덱스 miss
      mockPrisma.extractionJob.update.mockResolvedValue({
        ...baseJob,
        status: 'NO_MATCH',
      });

      await service.submitResult('job1', { event: { artist: '없는아티스트' } });

      expect(mockPrisma.extractionJob.update).toHaveBeenCalledWith({
        where: { id: 'job1' },
        data: expect.objectContaining({
          status: 'NO_MATCH',
          resultPayload: expect.objectContaining({ candidates: [] }),
        }),
      });
      expect(mockEvents.notifyDone).toHaveBeenCalledWith('job1');
    });

    it('매칭 후보가 있으면 MATCHED + candidates(concertId) 로 확정', async () => {
      mockPrisma.extractionJob.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'EXTRACTING',
      });
      mockConcertIndex.matchArtist.mockResolvedValue([
        { artistId: 42, name: 'HITORIE (히토리에)' },
      ]);
      mockPrisma.concert.findMany.mockResolvedValue([{ id: 101 }, { id: 202 }]);
      mockPrisma.extractionJob.update.mockResolvedValue({
        ...baseJob,
        status: 'MATCHED',
      });

      await service.submitResult('job1', { event: { artist: '히토리에' } });

      expect(mockConcertIndex.matchArtist).toHaveBeenCalledWith('히토리에');
      expect(mockPrisma.extractionJob.update).toHaveBeenCalledWith({
        where: { id: 'job1' },
        data: expect.objectContaining({
          status: 'MATCHED',
          resultPayload: expect.objectContaining({ candidates: [101, 202] }),
        }),
      });
      expect(mockEvents.notifyDone).toHaveBeenCalledWith('job1');
    });

    it('아티스트명이 없으면 매칭 없이 NO_MATCH', async () => {
      mockPrisma.extractionJob.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'EXTRACTING',
      });
      mockPrisma.extractionJob.update.mockResolvedValue({
        ...baseJob,
        status: 'NO_MATCH',
      });

      await service.submitResult('job1', { caption: '아티스트 필드 없음' });

      expect(mockConcertIndex.matchArtist).not.toHaveBeenCalled();
      expect(mockPrisma.extractionJob.update).toHaveBeenCalledWith({
        where: { id: 'job1' },
        data: expect.objectContaining({ status: 'NO_MATCH' }),
      });
    });
  });

  describe('reportFail', () => {
    it('NO_MATCH 로 확정하고 notifyDone 호출', async () => {
      mockPrisma.extractionJob.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'EXTRACTING',
      });
      mockPrisma.extractionJob.update.mockResolvedValue({
        ...baseJob,
        status: 'NO_MATCH',
      });

      await service.reportFail('job1', 'fetch failed');

      expect(mockPrisma.extractionJob.update).toHaveBeenCalledWith({
        where: { id: 'job1' },
        data: { status: 'NO_MATCH' },
      });
      expect(mockEvents.notifyDone).toHaveBeenCalledWith('job1');
    });
  });

  describe('createAndWait', () => {
    it('이미 종결된 잡이면 대기 없이 매핑 결과 반환', async () => {
      mockPrisma.extractionJob.findFirst.mockResolvedValue({
        ...baseJob,
        status: 'NO_MATCH',
      });

      const result = await service.createAndWait(baseJob.instagramUrl);

      expect(mockEvents.waitForDone).not.toHaveBeenCalled();
      expect(result).toEqual({ result: 'NO_MATCH', concerts: [] });
    });

    it('미종결이면 대기 후 최신 상태를 다시 읽어 매핑', async () => {
      // createJob → PENDING 신규 생성
      mockPrisma.extractionJob.findFirst.mockResolvedValue(null);
      mockPrisma.extractionJob.create.mockResolvedValue({
        ...baseJob,
        status: 'PENDING',
      });
      // 대기 후 findById 재조회 → MATCHED
      mockPrisma.extractionJob.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'MATCHED',
      });

      const result = await service.createAndWait(baseJob.instagramUrl);

      expect(mockEvents.waitForDone).toHaveBeenCalledWith(
        'job1',
        50_000,
        expect.any(Function),
      );
      expect(result).toEqual({ result: 'MATCHED', concerts: [] });
    });

    it('타임아웃으로 여전히 EXTRACTING 이면 NO_MATCH 로 매핑', async () => {
      mockPrisma.extractionJob.findFirst.mockResolvedValue(null);
      mockPrisma.extractionJob.create.mockResolvedValue({
        ...baseJob,
        status: 'PENDING',
      });
      mockPrisma.extractionJob.findUnique.mockResolvedValue({
        ...baseJob,
        status: 'EXTRACTING', // 아직 안 끝남
      });

      const result = await service.createAndWait(baseJob.instagramUrl);

      expect(result).toEqual({ result: 'NO_MATCH', concerts: [] });
    });
  });

  describe('claimNext', () => {
    it('PENDING 없으면 null 반환', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb({
          $queryRaw: jest.fn().mockResolvedValue([]),
          $executeRaw: jest.fn(),
        }),
      );

      const result = await service.claimNext();
      expect(result).toBeNull();
    });

    it('PENDING 있으면 EXTRACTING 전이 후 jobId/url 반환', async () => {
      const tx = {
        $queryRaw: jest
          .fn()
          .mockResolvedValue([{ id: 'job1', instagram_url: 'https://x/p/A/' }]),
        extractionJob: { update: jest.fn().mockResolvedValue({ id: 'job1' }) },
      };
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

      const result = await service.claimNext();

      // SELECT FOR UPDATE SKIP LOCKED 는 raw, 전이 UPDATE 는 Prisma
      expect(tx.extractionJob.update).toHaveBeenCalledWith({
        where: { id: 'job1' },
        data: { status: 'EXTRACTING' },
      });
      expect(result).toEqual({
        jobId: 'job1',
        instagramUrl: 'https://x/p/A/',
      });
    });
  });
});
