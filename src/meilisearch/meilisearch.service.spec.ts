import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { MeilisearchService } from './meilisearch.service';

const mockIndex = {
  updateSettings: jest.fn(),
  addDocuments: jest.fn(),
  search: jest.fn(),
};

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: jest.fn(() => mockIndex),
  })),
}));

describe('MeilisearchService', () => {
  let service: MeilisearchService;
  let mockPrismaService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockPrismaService = {
      representativeArtist: {
        findMany: jest.fn(),
      },
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'MEILISEARCH_HOST') return 'http://localhost:7700';
        if (key === 'MEILISEARCH_API_KEY') return 'test-key';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeilisearchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MeilisearchService>(MeilisearchService);

    // onModuleInit 시뮬레이션 — index 인스턴스 주입
    await service.onModuleInit();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('index settings 가 searchableAttributes / filterableAttributes 로 설정됨', async () => {
      await service.onModuleInit();

      expect(mockIndex.updateSettings).toHaveBeenCalledWith({
        searchableAttributes: ['artistName'],
        filterableAttributes: ['genreId'],
      });
    });
  });

  describe('bulkUpsertAll', () => {
    it('아티스트가 0건이면 addDocuments 호출 안 하고 0 반환', async () => {
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([]);

      const result = await service.bulkUpsertAll();

      expect(result).toBe(0);
      expect(mockIndex.addDocuments).not.toHaveBeenCalled();
    });

    it('아티스트 목록을 인덱스에 push 하고 건수 반환', async () => {
      const artists = [
        { id: 1, artistName: 'NewJeans', genreId: 1 },
        { id: 2, artistName: 'IVE', genreId: 1 },
        { id: 3, artistName: 'aespa', genreId: 1 },
      ];
      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        artists,
      );

      const result = await service.bulkUpsertAll();

      expect(result).toBe(3);
      expect(mockIndex.addDocuments).toHaveBeenCalledWith(artists, {
        primaryKey: 'id',
      });
      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        select: { id: true, artistName: true, genreId: true },
      });
    });
  });

  describe('search', () => {
    it('Meilisearch 결과를 ids/totalCount 형태로 변환', async () => {
      mockIndex.search.mockResolvedValue({
        hits: [
          { id: 10, artistName: 'NewJeans' },
          { id: 20, artistName: 'IVE' },
        ],
        estimatedTotalHits: 50,
      });

      const result = await service.search('keyword', 0, 20);

      expect(result).toEqual({ ids: [10, 20], totalCount: 50 });
      expect(mockIndex.search).toHaveBeenCalledWith('keyword', {
        offset: 0,
        limit: 20,
      });
    });

    it('estimatedTotalHits 가 없으면 hits.length 사용 (fallback)', async () => {
      mockIndex.search.mockResolvedValue({
        hits: [
          { id: 1, artistName: 'A' },
          { id: 2, artistName: 'B' },
        ],
      });

      const result = await service.search('k', 0, 10);

      expect(result).toEqual({ ids: [1, 2], totalCount: 2 });
    });

    it('hits 비어있으면 빈 ids + totalCount 0 (fallback)', async () => {
      mockIndex.search.mockResolvedValue({
        hits: [],
        estimatedTotalHits: 0,
      });

      const result = await service.search('nothing', 0, 10);

      expect(result).toEqual({ ids: [], totalCount: 0 });
    });
  });
});