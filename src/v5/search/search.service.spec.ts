import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { SearchService } from './search.service';
import { RepresentativeArtistResponseDto } from './dto/representative-artist-response.dto';

describe('SearchService', () => {
  let service: SearchService;
  let mockPrismaService: any;

  // Mock 데이터
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
        // Transaction에 전달된 Promise들을 실행하고 결과를 배열로 반환
        return Promise.all(queries);
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
      },
      searchSection: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    // Mock 리셋
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getArtistSearchResults', () => {
    it('키워드 없이 아티스트 검색 - 성공', async () => {
      // Given
      const cursor = undefined;
      const size = 10;
      const keyword = undefined;

      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        mockRepresentativeArtists,
      );
      mockPrismaService.representativeArtist.count.mockResolvedValue(2);

      // When
      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      // Then
      const expectedData = mockRepresentativeArtists.map(
        (artist) => new RepresentativeArtistResponseDto(artist),
      );
      expect(result.data).toEqual(expectedData);
      expect(result.cursor).toBe(2);
      expect(result.totalCount).toBe(2);

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: 0,
        cursor: undefined,
        take: size,
      });

      expect(mockPrismaService.representativeArtist.count).toHaveBeenCalledWith(
        {
          where: {},
        },
      );
    });

    it('키워드로 아티스트 검색 - 성공', async () => {
      // Given
      const cursor = undefined;
      const size = 10;
      const keyword = 'New';
      const filteredArtists = [mockRepresentativeArtists[0]];

      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        filteredArtists,
      );
      mockPrismaService.representativeArtist.count.mockResolvedValue(1);

      // When
      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      // Then
      const expectedData = filteredArtists.map(
        (artist) => new RepresentativeArtistResponseDto(artist),
      );
      expect(result.data).toEqual(expectedData);
      expect(result.cursor).toBe(1);
      expect(result.totalCount).toBe(1);

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        where: { artistName: { contains: keyword } },
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: 0,
        cursor: undefined,
        take: size,
      });
    });

    it('커서를 사용한 페이지네이션 - 성공', async () => {
      // Given
      const cursor = 1;
      const size = 10;
      const keyword = undefined;
      const nextPageArtists = [mockRepresentativeArtists[1]];

      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        nextPageArtists,
      );
      mockPrismaService.representativeArtist.count.mockResolvedValue(2);

      // When
      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      // Then
      const expectedData = nextPageArtists.map(
        (artist) => new RepresentativeArtistResponseDto(artist),
      );
      expect(result.data).toEqual(expectedData);
      expect(result.cursor).toBe(2);
      expect(result.totalCount).toBe(2);

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ genreId: 'asc' }, { id: 'asc' }],
        skip: 1,
        cursor: { id: cursor },
        take: size,
      });
    });

    it('검색 결과가 없을 때 - 성공', async () => {
      // Given
      const cursor = undefined;
      const size = 10;
      const keyword = 'NonExistent';

      mockPrismaService.representativeArtist.findMany.mockResolvedValue([]);
      mockPrismaService.representativeArtist.count.mockResolvedValue(0);

      // When
      const result = await service.getArtistSearchResults(
        cursor,
        size,
        keyword,
      );

      // Then
      expect(result.data).toEqual([]);
      expect(result.cursor).toBeNull();
      expect(result.totalCount).toBe(0);
    });

    it('데이터베이스 에러 발생 - 실패', async () => {
      // Given
      const cursor = undefined;
      const size = 10;
      const keyword = undefined;

      // Transaction 내부에서 에러가 발생하도록 설정
      mockPrismaService.$transaction.mockRejectedValue(new Error('DB Error'));

      // When & Then
      await expect(
        service.getArtistSearchResults(cursor, size, keyword),
      ).rejects.toThrow('DB Error');
    });
  });
});
