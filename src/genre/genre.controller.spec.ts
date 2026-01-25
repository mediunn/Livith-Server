import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { GenreResponseDto } from './dto/genre-response.dto';

describe('GenreController', () => {
  let controller: GenreController;
  let service: jest.Mocked<GenreService>;

  const mockGenres = [
    new GenreResponseDto({
      id: 1,
      name: 'RAP_HIPHOP',
      imgUrl: 'https://example.com/pop.jpg',
    }),
    new GenreResponseDto({
      id: 2,
      name: 'ACOUSTIC',
      imgUrl: 'https://example.com/rock.jpg',
    }),
    new GenreResponseDto({
      id: 3,
      name: 'JPOP',
      imgUrl: 'https://example.com/kpop.jpg',
    }),
  ];
  const mockGenreService = {
    getGenres: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();

    controller = module.get<GenreController>(GenreController);
    service = module.get(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGenres', () => {
    it('장르 목록을 정상적으로 반환한다', async () => {
      // Arrange
      service.getGenres.mockResolvedValue(mockGenres);

      // Act
      const result = await controller.getGenres();

      // Assert
      expect(result).toEqual(mockGenres);
      expect(service.getGenres).toHaveBeenCalledTimes(1);
    });

    it('빈 장르 목록을 반환한다', async () => {
      // Arrange
      service.getGenres.mockResolvedValue([]);

      // Act
      const result = await controller.getGenres();

      // Assert
      expect(result).toEqual([]);
      expect(service.getGenres).toHaveBeenCalledTimes(1);
    });

    it('서비스 에러 시 예외가 발생한다', async () => {
      // Arrange
      const error = new Error('Database connection error');
      service.getGenres.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getGenres()).rejects.toThrow(error);
      expect(service.getGenres).toHaveBeenCalledTimes(1);
    });
  });
});
