import { Test, TestingModule } from '@nestjs/testing';
import { MeilisearchController } from './meilisearch.controller';
import { MeilisearchService } from './meilisearch.service';

describe('MeilisearchController', () => {
  let controller: MeilisearchController;
  let mockMeilisearchService: any;

  beforeEach(async () => {
    mockMeilisearchService = {
      bulkUpsertAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeilisearchController],
      providers: [
        { provide: MeilisearchService, useValue: mockMeilisearchService },
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
});