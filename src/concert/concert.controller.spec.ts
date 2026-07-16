import { Test, TestingModule } from '@nestjs/testing';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';

const mockConcertService = {
  getConcerts: jest.fn(),
  requestConcertInfo: jest.fn(),
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

  describe('requestConcertInfo', () => {
    it('요청 body를 서비스로 전달해야 함', async () => {
      // Given
      const req = { user: { userId: 10 } };
      const body = {
        autoRegister: true,
        title: '테일러 스위프트 콘서트',
        url: 'https://www.example.com/concert/1',
        requestContent: '아티스트명: 테일러 스위프트',
      };
      const expected = {
        id: 1,
        userId: 10,
        autoRegister: true,
        title: body.title,
        url: body.url,
        requestContent: body.requestContent,
      };
      mockConcertService.requestConcertInfo.mockResolvedValue(expected);

      // When
      const result = await controller.requestConcertInfo(req, body);

      // Then
      expect(result).toEqual(expected);
      expect(mockConcertService.requestConcertInfo).toHaveBeenCalledWith(
        10,
        body.autoRegister,
        body.title,
        body.url,
        body.requestContent,
      );
    });
  });
});
