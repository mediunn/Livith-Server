import { Test, TestingModule } from '@nestjs/testing';
import { MeilisearchController } from './meilisearch.controller';
import { MeilisearchService } from './meilisearch.service';
import { ConcertArtistIndexService } from './concert-artist-index.service';

describe('MeilisearchController', () => {
  let controller: MeilisearchController;
  let mockMeilisearchService: any;
  let mockConcertArtistIndexService: any;

  beforeEach(async () => {
    mockMeilisearchService = {
      bulkUpsertAll: jest.fn(),
    };
    mockConcertArtistIndexService = {
      bulkUpsertAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeilisearchController],
      providers: [
        { provide: MeilisearchService, useValue: mockMeilisearchService },
        {
          provide: ConcertArtistIndexService,
          useValue: mockConcertArtistIndexService,
        },
      ],
    }).compile();

    controller = module.get<MeilisearchController>(MeilisearchController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('reindex', () => {
    it('bulkUpsertAll 호출 후 count 와 함께 success 응답', async () => {
      mockMeilisearchService.bulkUpsertAll.mockResolvedValue(120);

      const result = await controller.reindex();

      expect(result).toEqual({ success: true, count: 120 });
      expect(mockMeilisearchService.bulkUpsertAll).toHaveBeenCalledTimes(1);
    });

    it('아티스트 0건일 때도 success: true (count 0)', async () => {
      mockMeilisearchService.bulkUpsertAll.mockResolvedValue(0);

      const result = await controller.reindex();

      expect(result).toEqual({ success: true, count: 0 });
    });
  });

  describe('reindexConcertArtists', () => {
    it('콘서트 아티스트 인덱스 bulkUpsertAll 호출 후 success 응답', async () => {
      mockConcertArtistIndexService.bulkUpsertAll.mockResolvedValue(45);

      const result = await controller.reindexConcertArtists();

      expect(result).toEqual({ success: true, count: 45 });
      expect(mockConcertArtistIndexService.bulkUpsertAll).toHaveBeenCalledTimes(
        1,
      );
      expect(mockMeilisearchService.bulkUpsertAll).not.toHaveBeenCalled();
    });

    it('아티스트 0건일 때도 success: true (count 0)', async () => {
      mockConcertArtistIndexService.bulkUpsertAll.mockResolvedValue(0);

      const result = await controller.reindexConcertArtists();

      expect(result).toEqual({ success: true, count: 0 });
    });
  });
});
