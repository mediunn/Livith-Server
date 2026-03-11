import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { Provider } from '@prisma/client';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  genre: {
    findMany: jest.fn(),
  },
  representativeArtist: {
    findMany: jest.fn(),
  },
  userGenre: {
    createMany: jest.fn(),
  },
  userArtist: {
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: typeof mockPrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupData = {
      provider: Provider.kakao,
      providerId: 'test123',
      email: 'test@example.com',
      marketingConsent: true,
      nickname: '테스트유저',
      client: 'web',
      preferredGenreIds: [1, 2],
      preferredArtistIds: [1],
    };

    const mockUser = {
      id: 1,
      provider: Provider.kakao,
      providerId: 'test123',
      email: 'test@example.com',
      nickname: '테스트유저',
      marketingConsent: true,
      userGenres: [
        { genreId: 1, genreName: 'POP' },
        { genreId: 2, genreName: 'ROCK' },
      ],
      userArtists: [{ artistId: 1, artistName: '테스트아티스트' }],
    };

    const mockGenres = [
      { id: 1, name: 'POP' },
      { id: 2, name: 'ROCK' },
    ];

    const mockArtists = [{ id: 1, artistName: '테스트아티스트' }];

    beforeEach(() => {
      configService.get.mockReturnValue('test-secret');
      jwtService.sign.mockReturnValue('mock-token');
    });

    it('새로운 유저 회원가입 성공', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 1, ...signupData }),
            update: jest.fn().mockResolvedValue(mockUser),
          },
          genre: { findMany: jest.fn().mockResolvedValue(mockGenres) },
          representativeArtist: {
            findMany: jest.fn().mockResolvedValue(mockArtists),
          },
          userGenre: { createMany: jest.fn() },
          userArtist: { createMany: jest.fn() },
        };
        return await callback(mockTx as any);
      });

      // Act
      const result = await service.signup(
        signupData.provider,
        signupData.providerId,
        signupData.email,
        signupData.marketingConsent,
        signupData.nickname,
        signupData.client,
        signupData.preferredGenreIds,
        signupData.preferredArtistIds,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(2); // providerId와 nickname 중복 체크
    });

    it('이미 존재하는 providerId로 회원가입 시 에러 발생', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      // Act & Assert
      await expect(
        service.signup(
          signupData.provider,
          signupData.providerId,
          signupData.email,
          signupData.marketingConsent,
          signupData.nickname,
          signupData.client,
          signupData.preferredGenreIds,
          signupData.preferredArtistIds,
        ),
      ).rejects.toThrow(new BadRequestException(ErrorCode.USER_ALREADY_EXISTS));
    });

    it('이미 존재하는 닉네임으로 회원가입 시 에러 발생', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValueOnce(null); // providerId 체크
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser); // nickname 체크

      // Act & Assert
      await expect(
        service.signup(
          signupData.provider,
          signupData.providerId,
          signupData.email,
          signupData.marketingConsent,
          signupData.nickname,
          signupData.client,
          signupData.preferredGenreIds,
          signupData.preferredArtistIds,
        ),
      ).rejects.toThrow(
        new BadRequestException(ErrorCode.NICKNAME_ALREADY_EXISTS),
      );
    });

    it('유효하지 않은 장르 ID로 회원가입 시 에러 발생', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 1, ...signupData }),
          },
          genre: { findMany: jest.fn().mockResolvedValue([mockGenres[0]]) }, // 1개만 반환
          representativeArtist: { findMany: jest.fn() },
          userGenre: { createMany: jest.fn() },
          userArtist: { createMany: jest.fn() },
        };
        return await callback(mockTx as any);
      });

      // Act & Assert
      await expect(
        service.signup(
          signupData.provider,
          signupData.providerId,
          signupData.email,
          signupData.marketingConsent,
          signupData.nickname,
          signupData.client,
          signupData.preferredGenreIds,
          signupData.preferredArtistIds,
        ),
      ).rejects.toThrow(new BadRequestException(ErrorCode.GENRE_NOT_FOUND));
    });

    it('유효하지 않은 아티스트 ID로 회원가입 시 에러 발생', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 1, ...signupData }),
          },
          genre: { findMany: jest.fn().mockResolvedValue(mockGenres) },
          representativeArtist: { findMany: jest.fn().mockResolvedValue([]) }, // 빈 배열 반환
          userGenre: { createMany: jest.fn() },
          userArtist: { createMany: jest.fn() },
        };
        return await callback(mockTx as any);
      });

      // Act & Assert
      await expect(
        service.signup(
          signupData.provider,
          signupData.providerId,
          signupData.email,
          signupData.marketingConsent,
          signupData.nickname,
          signupData.client,
          signupData.preferredGenreIds,
          signupData.preferredArtistIds,
        ),
      ).rejects.toThrow(new BadRequestException(ErrorCode.ARTIST_NOT_FOUND));
    });

    it('빈 장르 배열로 회원가입 성공', async () => {
      // Arrange
      const signupDataWithEmptyGenres = {
        ...signupData,
        preferredGenreIds: [],
      };
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 1, ...signupData }),
            update: jest.fn().mockResolvedValue(mockUser),
          },
          genre: { findMany: jest.fn() },
          representativeArtist: {
            findMany: jest.fn().mockResolvedValue(mockArtists),
          },
          userGenre: { createMany: jest.fn() },
          userArtist: { createMany: jest.fn() },
        };
        return await callback(mockTx as any);
      });

      // Act
      const result = await service.signup(
        signupDataWithEmptyGenres.provider,
        signupDataWithEmptyGenres.providerId,
        signupDataWithEmptyGenres.email,
        signupDataWithEmptyGenres.marketingConsent,
        signupDataWithEmptyGenres.nickname,
        signupDataWithEmptyGenres.client,
        signupDataWithEmptyGenres.preferredGenreIds,
        signupDataWithEmptyGenres.preferredArtistIds,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      refreshToken: 'old-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1일 후
    };

    beforeEach(() => {
      configService.get.mockReturnValue('test-secret');
      jwtService.verify.mockReturnValue({
        userId: 1,
        email: 'test@example.com',
      });
      jwtService.sign.mockReturnValue('new-token');
    });

    it('refresh token 갱신 시 refreshTokenExpiresAt이 연장된다', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        refreshToken: 'new-token',
      });

      const before = Date.now();
      await service.refreshToken('old-refresh-token');
      const after = Date.now();

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          refreshToken: 'new-token',
          refreshTokenExpiresAt: expect.any(Date),
        }),
      });

      const updatedExpiresAt: Date =
        prismaService.user.update.mock.calls[0][0].data.refreshTokenExpiresAt;
      const expiresAtMs = updatedExpiresAt.getTime();

      expect(expiresAtMs).toBeGreaterThanOrEqual(
        before + 4 * 24 * 60 * 60 * 1000 - 1000,
      );
      expect(expiresAtMs).toBeLessThanOrEqual(
        after + 4 * 24 * 60 * 60 * 1000 + 1000,
      );
    });

    it('만료된 refreshTokenExpiresAt이면 에러 발생', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokenExpiresAt: new Date(Date.now() - 1000), // 이미 만료
      });

      await expect(service.refreshToken('old-refresh-token')).rejects.toThrow();
    });
  });

  describe('validateOAuthLogin', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      provider: Provider.kakao,
      providerId: 'kakao123',
      deletedAt: null,
      refreshToken: 'old-token',
      refreshTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userGenres: [],
      userArtists: [],
    };

    beforeEach(() => {
      configService.get.mockReturnValue('test-secret');
      jwtService.sign.mockReturnValue('new-token');
    });

    it('기존 유저 로그인 시 refreshTokenExpiresAt이 갱신된다', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        refreshToken: 'new-token',
        userGenres: [],
        userArtists: [],
      });

      const before = Date.now();
      await service.validateOAuthLogin({
        provider: 'kakao',
        providerId: 'kakao123',
        email: 'test@example.com',
      });
      const after = Date.now();

      const updatedExpiresAt: Date =
        prismaService.user.update.mock.calls[0][0].data.refreshTokenExpiresAt;
      const expiresAtMs = updatedExpiresAt.getTime();

      expect(expiresAtMs).toBeGreaterThanOrEqual(
        before + 4 * 24 * 60 * 60 * 1000 - 1000,
      );
      expect(expiresAtMs).toBeLessThanOrEqual(
        after + 4 * 24 * 60 * 60 * 1000 + 1000,
      );
    });
  });
});
