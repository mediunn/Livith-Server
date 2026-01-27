import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'prisma/prisma.service';
import { UserGenreResponseDto } from './dto/user-genre-response.dto';
import { UserArtistResponseDto } from './dto/user-artist-response.dto';
import { NotFoundException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';

describe('UserService', () => {
  let service: UserService;
  let mockPrismaService: any;

  // Mock 데이터
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    nickname: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockGenres = [
    {
      id: 1,
      name: 'K-Pop',
      imgUrl: 'https://example.com/kpop.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'Rock',
      imgUrl: 'https://example.com/rock.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockArtists = [
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

  const mockUserWithGenres = {
    ...mockUser,
    userGenres: [{ genre: mockGenres[0] }, { genre: mockGenres[1] }],
  };

  const mockUserWithArtists = {
    ...mockUser,
    userArtists: [{ artist: mockArtists[0] }, { artist: mockArtists[1] }],
  };

  beforeEach(async () => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // Mock 리셋
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserGenrePreferences', () => {
    it('유저 취향 장르 조회 - 성공', async () => {
      // Given
      const userId = 1;
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithGenres);

      // When
      const result = await service.getUserGenrePreferences(userId);

      // Then
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { userGenres: { include: { genre: true } } },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserGenreResponseDto);
      expect(result[0].id).toBe(mockGenres[0].id);
      expect(result[0].userId).toBe(userId);
      expect(result[0].name).toBe(mockGenres[0].name);
      expect(result[0].imgUrl).toBe(mockGenres[0].imgUrl);

      expect(result[1]).toBeInstanceOf(UserGenreResponseDto);
      expect(result[1].id).toBe(mockGenres[1].id);
      expect(result[1].userId).toBe(userId);
      expect(result[1].name).toBe(mockGenres[1].name);
      expect(result[1].imgUrl).toBe(mockGenres[1].imgUrl);
    });

    it('취향 장르가 없는 유저 - 성공', async () => {
      // Given
      const userId = 1;
      const userWithoutGenres = {
        ...mockUser,
        userGenres: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutGenres);

      // When
      const result = await service.getUserGenrePreferences(userId);

      // Then
      expect(result).toEqual([]);
    });

    it('존재하지 않는 유저 - 실패', async () => {
      // Given
      const userId = 999;
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(service.getUserGenrePreferences(userId)).rejects.toThrow(
        new NotFoundException(ErrorCode.USER_NOT_FOUND),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { userGenres: { include: { genre: true } } },
      });
    });
  });

  describe('getUserArtistPreferences', () => {
    it('유저 취향 아티스트 조회 - 성공', async () => {
      // Given
      const userId = 1;
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithArtists);

      // When
      const result = await service.getUserArtistPreferences(userId);

      // Then
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { userArtists: { include: { artist: true } } },
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserArtistResponseDto);
      expect(result[0].id).toBe(mockArtists[0].id);
      expect(result[0].userId).toBe(userId);
      expect(result[0].name).toBe(mockArtists[0].artistName);
      expect(result[0].imgUrl).toBe(mockArtists[0].imgUrl);

      expect(result[1]).toBeInstanceOf(UserArtistResponseDto);
      expect(result[1].id).toBe(mockArtists[1].id);
      expect(result[1].userId).toBe(userId);
      expect(result[1].name).toBe(mockArtists[1].artistName);
      expect(result[1].imgUrl).toBe(mockArtists[1].imgUrl);
    });

    it('취향 아티스트가 없는 유저 - 성공', async () => {
      // Given
      const userId = 1;
      const userWithoutArtists = {
        ...mockUser,
        userArtists: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutArtists);

      // When
      const result = await service.getUserArtistPreferences(userId);

      // Then
      expect(result).toEqual([]);
    });

    it('존재하지 않는 유저 - 실패', async () => {
      // Given
      const userId = 999;
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(service.getUserArtistPreferences(userId)).rejects.toThrow(
        new NotFoundException(ErrorCode.USER_NOT_FOUND),
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { userArtists: { include: { artist: true } } },
      });
    });
  });
});
