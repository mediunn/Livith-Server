import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../../../prisma-v5/prisma.service';
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
      representativeArtist: {
        findMany: jest.fn(),
      },
      userArtist: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
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

  describe('setUserArtistPreferences', () => {
    it('유저 아티스트 취향 설정 - 성공', async () => {
      // Given
      const userId = 1;
      const artistIds = [1, 2];

      // User validation을 위한 mock
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Artists 조회 mock
      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        mockArtists,
      );

      // 기존 취향 삭제 mock
      mockPrismaService.userArtist.deleteMany.mockResolvedValue({ count: 0 });

      // 새로운 취향 생성 mock
      mockPrismaService.userArtist.createMany.mockResolvedValue({ count: 2 });

      // When
      const result = await service.setUserArtistPreferences(userId, artistIds);

      // Then
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { userArtists: { include: { artist: true } } },
      });

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        where: { id: { in: artistIds } },
      });

      expect(mockPrismaService.userArtist.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });

      expect(mockPrismaService.userArtist.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: userId,
            artistId: mockArtists[0].id,
            artistName: mockArtists[0].artistName,
          },
          {
            userId: userId,
            artistId: mockArtists[1].id,
            artistName: mockArtists[1].artistName,
          },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserArtistResponseDto);
      expect(result[0].id).toBe(mockArtists[0].id);
      expect(result[0].name).toBe(mockArtists[0].artistName);
      expect(result[1]).toBeInstanceOf(UserArtistResponseDto);
      expect(result[1].id).toBe(mockArtists[1].id);
      expect(result[1].name).toBe(mockArtists[1].artistName);
    });

    it('존재하지 않는 아티스트 ID 포함 - 실패', async () => {
      // Given
      const userId = 1;
      const artistIds = [1, 999]; // 999는 존재하지 않는 아티스트 ID

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([
        mockArtists[0],
      ]); // 1개만 반환

      // When & Then
      await expect(
        service.setUserArtistPreferences(userId, artistIds),
      ).rejects.toThrow(new NotFoundException(ErrorCode.ARTIST_NOT_FOUND));

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        where: { id: { in: artistIds } },
      });
    });

    it('존재하지 않는 유저 - 실패', async () => {
      // Given
      const userId = 999;
      const artistIds = [1, 2];

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(
        service.setUserArtistPreferences(userId, artistIds),
      ).rejects.toThrow(new NotFoundException(ErrorCode.USER_NOT_FOUND));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { userArtists: { include: { artist: true } } },
      });
    });

    it('빈 아티스트 배열로 취향 삭제 - 성공', async () => {
      // Given
      const userId = 1;
      const artistIds = [];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([]);
      mockPrismaService.userArtist.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.userArtist.createMany.mockResolvedValue({ count: 0 });

      // When
      const result = await service.setUserArtistPreferences(userId, artistIds);

      // Then
      expect(mockPrismaService.userArtist.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });

      expect(mockPrismaService.userArtist.createMany).toHaveBeenCalledWith({
        data: [],
      });

      expect(result).toEqual([]);
    });

    it('기존 취향을 새로운 취향으로 덮어쓰기 - 성공', async () => {
      // Given
      const userId = 1;
      const artistIds = [3]; // 새로운 아티스트 ID
      const newArtist = {
        id: 3,
        genreId: 1,
        artistName: 'IU',
        imgUrl: 'https://example.com/iu.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([
        newArtist,
      ]);
      mockPrismaService.userArtist.deleteMany.mockResolvedValue({ count: 2 }); // 기존 2개 삭제
      mockPrismaService.userArtist.createMany.mockResolvedValue({ count: 1 }); // 새로 1개 생성

      // When
      const result = await service.setUserArtistPreferences(userId, artistIds);

      // Then
      expect(mockPrismaService.userArtist.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId },
      });

      expect(mockPrismaService.userArtist.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: userId,
            artistId: newArtist.id,
            artistName: newArtist.artistName,
          },
        ],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(newArtist.id);
      expect(result[0].name).toBe(newArtist.artistName);
    });

    it('중복된 아티스트 ID가 포함된 경우 검증 실패 - 실패', async () => {
      // Given
      const userId = 1;
      const artistIds = [1, 1, 2]; // 중복된 ID 포함
      const uniqueArtists = [mockArtists[0], mockArtists[1]]; // DB에서는 2개만 반환

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      // DB의 findMany는 중복을 제거하여 2개만 반환하지만, artistIds는 3개
      mockPrismaService.representativeArtist.findMany.mockResolvedValue(
        uniqueArtists,
      );

      // When & Then
      await expect(
        service.setUserArtistPreferences(userId, artistIds),
      ).rejects.toThrow(new NotFoundException(ErrorCode.ARTIST_NOT_FOUND));

      expect(
        mockPrismaService.representativeArtist.findMany,
      ).toHaveBeenCalledWith({
        where: { id: { in: artistIds } },
      });
    });
  });
});
