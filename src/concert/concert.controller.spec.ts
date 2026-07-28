import { Test, TestingModule } from '@nestjs/testing';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';

const mockConcertService = {
  getConcerts: jest.fn(),
};

describe('ConcertController', () => {
  let controller: ConcertController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcertController],
      providers: [
        {
          provide: ConcertService,
          useValue: mockConcertService,
        },
      ],
    }).compile();

    controller = module.get<ConcertController>(ConcertController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConcerts', () => {
    it('쿼리 파라미터를 서비스로 전달해야 함', async () => {
      // Given
      const query = { cursor: 12, size: 20 };
      const expected = { data: [], cursor: null };
      mockConcertService.getConcerts.mockResolvedValue(expected);

      // When
      const result = await controller.getConcerts(query as any);

      // Then
      expect(result).toEqual(expected);
      expect(mockConcertService.getConcerts).toHaveBeenCalledWith(
        query.cursor,
        query.size,
      );
    });
  });
});
