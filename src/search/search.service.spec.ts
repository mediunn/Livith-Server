import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { SearchService } from './search.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
import { RepresentativeArtistResponseDto } from './dto/representative-artist-response.dto';

describe('SearchService', () => {
  let service: SearchService;
  let mockPrismaService: any;
  let mockMeilisearchService: any;

  const mockRepresentativeArtists = [
    {
      id: 1,
      genreId: 1,
      artistName: 'NewJeans',
      imgUrl: 'https://example.com/newjeans.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      genreId: 1,
      artistName: 'IVE',
      imgUrl: 'https://example.com/ive.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    mockPrismaService = {
      $transaction: jest.fn((queries) => {
        if (Array.isArray(queries)) {
          return Promise.all(queries);
        }
        return queries(mockPrismaService);
      }),
      representativeArtist: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      banner: {
        findMany: jest.fn(),
      },
      concert: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      searchSection: {
        findMany: jest.fn(),
      },
    };

    mockMeilisearchService = {
      search: jest.fn(),
      bulkUpsertAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MeilisearchService, useValue: mockMeilisearchService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getArtistSearchResults', () => {
    it('키워드 없이 아티스트 검색 - 성공', async () => {
      const cursor = undefined;
      const size = 10;
      const keyword = undefined;

      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        mockRepresentativeArtists,
      );
      mockPrismaService.representativeArtist.count.mockResolvedValue(2);

      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      const expectedData = mockRepresentativeArtists.map(
        (artist) => new RepresentativeArtistResponseDto(artist),
      );
      expect(result.data).toEqual(expectedData);
      expect(result.cursor).toBe(2);
      expect(result.totalCount).toBe(2);

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: 0,
        cursor: undefined,
        take: size,
      });
      expect(
        mockPrismaService.representativeArtist.count,
      ).toHaveBeenCalledWith();
      expect(mockMeilisearchService.search).not.toHaveBeenCalled();
    });

    it('키워드로 아티스트 검색 (Meilisearch) - 성공', async () => {
      const cursor = undefined;
      const size = 10;
      const keyword = 'New';
      const filteredArtists = [mockRepresentativeArtists[0]];

      mockMeilisearchService.search.mockResolvedValue({
        ids: [1],
        totalCount: 1,
      });
      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        filteredArtists,
      );

      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      const expectedData = filteredArtists.map(
        (artist) => new RepresentativeArtistResponseDto(artist),
      );
      expect(result.data).toEqual(expectedData);
      // ids.length(1) < limit(10) 이므로 다음 페이지 없음
      expect(result.cursor).toBeNull();
      expect(result.totalCount).toBe(1);

      expect(mockMeilisearchService.search).toHaveBeenCalledWith(
        keyword,
        0,
        10,
      );
      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
      });
    });

    it('키워드 검색 + 다음 페이지 cursor 발급 - 성공', async () => {
      const cursor = undefined;
      const size = 2;
      const keyword = 'k';

      mockMeilisearchService.search.mockResolvedValue({
        ids: [1, 2],
        totalCount: 5,
      });
      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        mockRepresentativeArtists,
      );

      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      // ids.length(2) === limit(2) → cursor = offset(0) + limit(2) = 2
      expect(result.cursor).toBe(2);
      expect(result.totalCount).toBe(5);
      expect(mockMeilisearchService.search).toHaveBeenCalledWith(keyword, 0, 2);
    });

    it('키워드 검색 결과가 없을 때 - 빈 응답', async () => {
      const cursor = undefined;
      const size = 10;
      const keyword = 'NonExistent';

      mockMeilisearchService.search.mockResolvedValue({
        ids: [],
        totalCount: 0,
      });

      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      expect(result.data).toEqual([]);
      expect(result.cursor).toBeNull();
      expect(result.totalCount).toBe(0);
      // ids 비어있을 때 DB 조회 스킵
      expect(
        mockPrismaService.representativeArtist.findMany,
      ).not.toHaveBeenCalled();
    });

    it('cursor 페이지네이션 (키워드 없음) - 성공', async () => {
      const cursor = 1;
      const size = 10;
      const keyword = undefined;
      const nextPageArtists = [mockRepresentativeArtists[1]];

      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        nextPageArtists,
      );
      mockPrismaService.representativeArtist.count.mockResolvedValue(2);

      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      const expectedData = nextPageArtists.map(
        (artist) => new RepresentativeArtistResponseDto(artist),
      );
      expect(result.data).toEqual(expectedData);
      expect(result.cursor).toBe(2);
      expect(result.totalCount).toBe(2);

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: 1,
        cursor: { id: cursor },
        take: size,
      });
    });

    it('데이터베이스 에러 발생 - 실패', async () => {
      const cursor = undefined;
      const size = 10;
      const keyword = undefined;

      mockPrismaService.$transaction.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.getArtistSearchResults(cursor, size, keyword),
      ).rejects.toThrow('DB Error');
    });
  });
});
