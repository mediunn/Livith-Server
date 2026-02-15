import { Test, TestingModule } from '@nestjs/testing';
import { ErrorCode } from '../common/enums/error-code.enum';
import { BadRequestException } from '../common/exceptions/business.exception';
import { GetArtistSearchResultsDto } from './dto/get-artist-search-results.dto';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: jest.Mocked<SearchService>;

  const mockArtistSearchResults = {
    data: [
      {
        id: 1,
        genreId: 1,
        name: 'NewJeans',
        imgUrl: 'https://example.com/newjeans.jpg',
      },
    ],
    cursor: 1,
    totalCount: 1,
  };

  const mockBanners = [
    {
      id: 1,
      title: '테스트 배너',
      category: 'category1',
      imgUrl: 'https://example.com/banner.jpg',
      content: '배너 내용',
    },
  ];

  beforeEach(async () => {
    const mockSearchService = {
      getArtistSearchResults: jest.fn(),
      getConcertSearchResults: jest.fn(),
      getBanners: jest.fn(),
      getRecommendWords: jest.fn(),
      getSearchSections: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSearchArtists', () => {
    it('유효한 파라미터로 아티스트 검색 - 성공', async () => {
      // Given
      const query: GetArtistSearchResultsDto = {
        cursor: 1,
        size: 10,
        keyword: 'New',
      };

      searchService.getArtistSearchResults.mockResolvedValue(
        mockArtistSearchResults,
      );

      // When
      const result = await controller.getSearchArtists(query);

      // Then
      expect(result).toEqual(mockArtistSearchResults);
      expect(searchService.getArtistSearchResults).toHaveBeenCalledWith(
        query.cursor,
        query.size,
        query.keyword,
      );
    });

    it('모든 파라미터가 undefined인 경우 - 성공', async () => {
      // Given
      const query: GetArtistSearchResultsDto = {};

      searchService.getArtistSearchResults.mockResolvedValue(
        mockArtistSearchResults,
      );

      // When
      const result = await controller.getSearchArtists(query);

      // Then
      expect(result).toEqual(mockArtistSearchResults);
      expect(searchService.getArtistSearchResults).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });

    it('서비스에서 에러 발생 시 - 에러 전파', async () => {
      // Given
      const query: GetArtistSearchResultsDto = {
        cursor: 1,
        size: 10,
        keyword: 'test',
      };

      const error = new BadRequestException(ErrorCode.INVALID_CURSOR_FORMAT);
      searchService.getArtistSearchResults.mockRejectedValue(error);

      // When & Then
      await expect(controller.getSearchArtists(query)).rejects.toThrow(error);
    });
  });

  describe('getBanners', () => {
    it('배너 조회 - 성공', async () => {
      // Given
      searchService.getBanners.mockResolvedValue(mockBanners);

      // When
      const result = await controller.getBanners();

      // Then
      expect(result).toEqual(mockBanners);
      expect(searchService.getBanners).toHaveBeenCalled();
    });
  });

  describe('getRecommendWords', () => {
    it('추천 검색어 조회 - 성공', async () => {
      // Given
      const letter = 'a';
      const mockRecommendWords = ['artist1', 'artist2'];
      searchService.getRecommendWords.mockResolvedValue(mockRecommendWords);

      // When
      const result = await controller.getRecommendWords(letter);

      // Then
      expect(result).toEqual(mockRecommendWords);
      expect(searchService.getRecommendWords).toHaveBeenCalledWith(letter);
    });

    it('빈 검색어로 추천 검색어 조회 - 실패', async () => {
      // Given
      const letter = '';

      // When & Then
      expect(() => controller.getRecommendWords(letter)).toThrow(
        BadRequestException,
      );
    });

    it('공백만 있는 검색어로 추천 검색어 조회 - 실패', async () => {
      // Given
      const letter = '   ';

      // When & Then
      expect(() => controller.getRecommendWords(letter)).toThrow(
        BadRequestException,
      );
    });
  });
});
