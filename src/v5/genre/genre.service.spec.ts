import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GenreResponseDto } from './dto/genre-response.dto';
import { GenreType } from '@prisma/client';

const mockPrismaService = {
  genre: {
    findMany: jest.fn(),
  },
};

describe('GenreService', () => {
  let service: GenreService;
  let prismaService: typeof mockPrismaService;

  const mockGenres = [
    { id: 1, name: 'RAP_HIPHOP', imgUrl: 'https://example.com/rap.jpg' },
    { id: 2, name: 'ROCK_METAL', imgUrl: 'https://example.com/rock.jpg' },
    { id: 3, name: 'JPOP', imgUrl: 'https://example.com/jpop.jpg' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GenreService>(GenreService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGenres', () => {
    it('장르 목록을 정상적으로 반환한다', async () => {
      // Arrange
      prismaService.genre.findMany.mockResolvedValue(mockGenres);

      // Act
      const result = await service.getGenres();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(GenreResponseDto);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('RAP_HIPHOP');
      expect(result[0].imgUrl).toBe('https://example.com/rap.jpg');
      expect(prismaService.genre.findMany).toHaveBeenCalledTimes(1);
      expect(prismaService.genre.findMany).toHaveBeenCalledWith();
    });

    it('빈 장르 목록을 반환한다', async () => {
      // Arrange
      prismaService.genre.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getGenres();

      // Assert
      expect(result).toEqual([]);
      expect(prismaService.genre.findMany).toHaveBeenCalledTimes(1);
    });

    it('DB 오류 시 예외가 발생한다', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      prismaService.genre.findMany.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getGenres()).rejects.toThrow(error);
      expect(prismaService.genre.findMany).toHaveBeenCalledTimes(1);
    });

    it('GenreResponseDto 형태로 변환된다', async () => {
      // Arrange
      const singleGenre = [
        {
          id: 1,
          name: GenreType.RAP_HIPHOP,
          imgUrl: 'https://example.com/rap.jpg',
        },
      ];
      prismaService.genre.findMany.mockResolvedValue(singleGenre);

      // Act
      const result = await service.getGenres();

      // Assert
      expect(result[0]).toBeInstanceOf(GenreResponseDto);
      expect(result[0]).toEqual(new GenreResponseDto(singleGenre[0]));
    });
  });
});
