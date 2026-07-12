import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ConcertArtistIndexService } from './concert-artist-index.service';

const mockIndex = {
  updateSettings: jest.fn(),
  addDocuments: jest.fn(),
  search: jest.fn(),
};

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: jest.fn(() => mockIndex),
  })),
  Meilisearch: jest.fn().mockImplementation(() => ({
    index: jest.fn(() => mockIndex),
  })),
}));

describe('ConcertArtistIndexService', () => {
  let service: ConcertArtistIndexService;
  let mockPrismaService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockPrismaService = {
      artist: {
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
        ConcertArtistIndexService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ConcertArtistIndexService>(ConcertArtistIndexService);

    // onModuleInit 시뮬레이션 — index 인스턴스 주입
    await service.onModuleInit();

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('index settings 가 name/searchNames searchable 로 설정됨', async () => {
      await service.onModuleInit();

      expect(mockIndex.updateSettings).toHaveBeenCalledWith({
        searchableAttributes: ['name', 'searchNames'],
      });
    });
  });

  describe('bulkUpsertAll', () => {
    it('아티스트가 0건이면 addDocuments 호출 안 하고 0 반환', async () => {
      mockPrismaService.artist.findMany.mockResolvedValue([]);

      const result = await service.bulkUpsertAll();

      expect(result).toBe(0);
      expect(mockIndex.addDocuments).not.toHaveBeenCalled();
    });

    it('"영문 (한글)" 형태의 artist를 통짜/영문/한글로 분해해 색인', async () => {
      mockPrismaService.artist.findMany.mockResolvedValue([
        { id: 1, artist: 'MADKID (매드키드)' },
      ]);

      const result = await service.bulkUpsertAll();

      expect(result).toBe(1);
      expect(mockIndex.addDocuments).toHaveBeenCalledWith(
        [
          {
            id: 1,
            name: 'MADKID (매드키드)',
            searchNames: expect.arrayContaining([
              'MADKID (매드키드)',
              'MADKID',
              '매드키드',
            ]),
          },
        ],
        { primaryKey: 'id' },
      );
    });

    it('공백 포함 이름은 공백 제거 변형까지 색인', async () => {
      mockPrismaService.artist.findMany.mockResolvedValue([
        { id: 2, artist: 'ONE OK ROCK (원 오크 록)' },
      ]);

      await service.bulkUpsertAll();

      const [docs] = mockIndex.addDocuments.mock.calls[0];
      expect(docs[0].searchNames).toEqual(
        expect.arrayContaining([
          'ONE OK ROCK', // 분해된 영문
          '원 오크 록', // 분해된 한글
          'ONEOKROCK', // 공백 제거 변형
          '원오크록', // 공백 제거 변형
        ]),
      );
    });

    it('괄호 없는 artist는 원본 그대로 색인', async () => {
      mockPrismaService.artist.findMany.mockResolvedValue([
        { id: 3, artist: 'toe' },
      ]);

      await service.bulkUpsertAll();

      const [docs] = mockIndex.addDocuments.mock.calls[0];
      expect(docs[0].searchNames).toEqual(['toe']);
    });
  });

  describe('matchArtist', () => {
    it('검색 hits를 artistId/name으로 매핑해 반환', async () => {
      mockIndex.search.mockResolvedValue({
        hits: [
          { id: 1, name: 'ONE OK ROCK (원 오크 록)', searchNames: [] },
          { id: 7, name: 'MADKID (매드키드)', searchNames: [] },
        ],
      });

      const result = await service.matchArtist('원오크록');

      expect(mockIndex.search).toHaveBeenCalledWith('원오크록', { limit: 3 });
      expect(result).toEqual([
        { artistId: 1, name: 'ONE OK ROCK (원 오크 록)' },
        { artistId: 7, name: 'MADKID (매드키드)' },
      ]);
    });

    it('hits가 없으면 빈 배열 반환 (NO_MATCH)', async () => {
      mockIndex.search.mockResolvedValue({ hits: [] });

      const result = await service.matchArtist('없는 아티스트');

      expect(result).toEqual([]);
    });
  });
});
