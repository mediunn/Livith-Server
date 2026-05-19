import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { Provider } from '@prisma/client';
import axios from 'axios';

jest.mock('axios');

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

  describe('회원가입 Discord 알림', () => {
    const webhookUrl = 'https://discord.com/api/webhooks/123/abc';

    const createdUser = {
      id: 42,
      provider: Provider.kakao,
      providerId: 'discord-test',
      email: 'someone@example.com',
      nickname: '디코유저',
      marketingConsent: true,
      userGenres: [],
      userArtists: [],
    };

    const flush = () => new Promise((resolve) => setImmediate(resolve));

    const callSignup = () =>
      service.signup(
        Provider.kakao,
        'discord-test',
        'someone@example.com',
        true,
        '디코유저',
        'web',
        [],
        [],
      );

    beforeEach(() => {
      (axios.post as jest.Mock).mockResolvedValue({ status: 204 });
      jwtService.sign.mockReturnValue('mock-token');
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue({ id: 42 }),
            update: jest.fn().mockResolvedValue(createdUser),
          },
          genre: { findMany: jest.fn() },
          representativeArtist: { findMany: jest.fn() },
          userGenre: { createMany: jest.fn() },
          userArtist: { createMany: jest.fn() },
        };
        return callback(mockTx as any);
      });
    });

    it('웹후크 URL이 설정돼 있으면 회원가입 후 Discord로 POST한다', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'DISCORD_SIGNUP_WEBHOOK_URL' ? webhookUrl : 'test-secret',
      );

      await callSignup();
      await flush();

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [url, body, options] = (axios.post as jest.Mock).mock.calls[0];
      expect(url).toBe(webhookUrl);
      expect(options).toEqual({ timeout: 3000 });

      const fields = body.embeds[0].fields;
      expect(fields).toEqual(
        expect.arrayContaining([
          { name: '닉네임', value: '디코유저', inline: true },
          { name: 'Provider', value: Provider.kakao, inline: true },
          { name: '누적 가입자', value: '42번째', inline: false },
        ]),
      );

      const fieldNames = fields.map((f: any) => f.name);
      expect(fieldNames).not.toContain('User ID');
    });

    it('이메일은 알림에 포함되지 않는다', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'DISCORD_SIGNUP_WEBHOOK_URL' ? webhookUrl : 'test-secret',
      );

      await callSignup();
      await flush();

      const body = (axios.post as jest.Mock).mock.calls[0][1];
      const fieldNames = body.embeds[0].fields.map((f: any) => f.name);
      expect(fieldNames).not.toContain('이메일');
      expect(JSON.stringify(body)).not.toContain('someone@example.com');
    });

    it('웹후크 URL이 없으면 Discord 호출을 건너뛴다', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'DISCORD_SIGNUP_WEBHOOK_URL' ? undefined : 'test-secret',
      );

      const result = await callSignup();
      await flush();

      expect(result.user).toBeDefined();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('Discord 호출이 실패해도 회원가입은 성공한다', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'DISCORD_SIGNUP_WEBHOOK_URL' ? webhookUrl : 'test-secret',
      );
      (axios.post as jest.Mock).mockRejectedValue(new Error('discord down'));
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);

      const result = await callSignup();
      await flush();

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('mock-token');
      expect(warnSpy).toHaveBeenCalled();
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
        before + 14 * 24 * 60 * 60 * 1000 - 1000,
      );
      expect(expiresAtMs).toBeLessThanOrEqual(
        after + 14 * 24 * 60 * 60 * 1000 + 1000,
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
        before + 14 * 24 * 60 * 60 * 1000 - 1000,
      );
      expect(expiresAtMs).toBeLessThanOrEqual(
        after + 14 * 24 * 60 * 60 * 1000 + 1000,
      );
    });
  });
});
