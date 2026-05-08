import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'prisma/prisma.service';
import { UserGenreResponseDto } from './dto/user-genre-response.dto';
import { UserArtistResponseDto } from './dto/user-artist-response.dto';
import { NotFoundException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { InterestConcertSort } from '../common/enums/interest-concert-sort.enum';
import { ConcertStatus } from '../common/enums/concert-status.enum';

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
      concert: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      userArtist: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      userInterestConcert: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
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

  describe('interest concerts', () => {
    describe('addInterestConcertById', () => {
      it('관심 콘서트를 단건 추가해야 함', async () => {
        // Given
        const userId = 1;
        const concertId = 7;
        const mockConcert = {
          id: concertId,
          code: 'C-001',
          title: '콘서트 A',
          artist: '아티스트 A',
          startDate: '2026.01.01',
          endDate: '2026.01.02',
          poster: null,
          status: 'UPCOMING',
          ticketSite: null,
          ticketUrl: null,
          venue: '올림픽홀',
          introduction: '소개',
          label: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);
        mockPrismaService.userInterestConcert.createMany.mockResolvedValue({
          count: 1,
        });

        // When
        const result = await service.addInterestConcertById(userId, concertId);

        // Then
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: userId },
        });
        expect(mockPrismaService.concert.findUnique).toHaveBeenCalledWith({
          where: { id: concertId },
        });
        expect(mockPrismaService.userInterestConcert.createMany).toHaveBeenCalledWith(
          {
            data: [
              {
                userId,
                concertId: mockConcert.id,
                concertTitle: mockConcert.title,
                userNickname: mockUser.nickname,
              },
            ],
            skipDuplicates: true,
          },
        );
        expect(result.id).toBe(mockConcert.id);
        expect(result.title).toBe(mockConcert.title);
      });

      it('존재하지 않는 콘서트면 실패해야 함', async () => {
        // Given
        const userId = 1;
        const concertId = 999;

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.concert.findUnique.mockResolvedValue(null);

        // When & Then
        await expect(
          service.addInterestConcertById(userId, concertId),
        ).rejects.toThrow(new NotFoundException(ErrorCode.CONCERT_NOT_FOUND));
      });
    });

    describe('getInterestConcerts', () => {
      it('sort=TICKETING이면 예매일 정렬 메서드를 호출해야 함', async () => {
        // Given
        const userId = 1;
        const query = {
          sort: InterestConcertSort.TICKETING,
          size: 10,
          cursorDate: '2026-01-01T00:00:00.000Z',
          cursorId: 123,
        };
        const expected = {
          data: [{ id: 1 }],
          cursor: { date: '2026-01-02T00:00:00.000Z', id: 2 },
        };

        jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
        const ticketingSpy = jest
          .spyOn(service as any, 'getInterestConcertsByTicketing')
          .mockResolvedValue(expected);

        // When
        const result = await service.getInterestConcerts(query as any, userId);

        // Then
        expect(result).toEqual(expected);
        expect(ticketingSpy).toHaveBeenCalledWith(
          userId,
          query.cursorDate,
          query.cursorId,
          query.size,
        );
      });

      it('기본 정렬이면 공연일 정렬 메서드를 호출해야 함', async () => {
        // Given
        const userId = 1;
        const query = {
          size: 20,
          cursorDate: '2026.01.01',
          cursorId: 10,
        };
        const expected = {
          data: [{ id: 3 }],
          cursor: { date: '2026.01.02', id: 4 },
        };

        jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
        const concertSpy = jest
          .spyOn(service as any, 'getInterestConcertsByConcertDate')
          .mockResolvedValue(expected);

        // When
        const result = await service.getInterestConcerts(query as any, userId);

        // Then
        expect(result).toEqual(expected);
        expect(concertSpy).toHaveBeenCalledWith(
          userId,
          query.cursorDate,
          query.cursorId,
          query.size,
        );
      });
    });

    describe('checkInterestConcert', () => {
      it('관심 콘서트가 존재하면 isInterested=true를 반환해야 함', async () => {
        // Given
        const userId = 1;
        const concertId = 11;

        jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
        mockPrismaService.userInterestConcert.findFirst.mockResolvedValue({
          id: 1,
        });

        // When
        const result = await service.checkInterestConcert(userId, concertId);

        // Then
        expect(result).toEqual({ isInterested: true });
        expect(
          mockPrismaService.userInterestConcert.findFirst,
        ).toHaveBeenCalledWith({
          where: {
            userId,
            concertId,
          },
          select: { id: true },
        });
      });

      it('관심 콘서트가 없으면 isInterested=false를 반환해야 함', async () => {
        // Given
        const userId = 1;
        const concertId = 12;

        jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
        mockPrismaService.userInterestConcert.findFirst.mockResolvedValue(null);

        // When
        const result = await service.checkInterestConcert(userId, concertId);

        // Then
        expect(result).toEqual({ isInterested: false });
      });
    });

    describe('hasInterestConcertToast', () => {
      it('완료 또는 취소된 관심 콘서트가 있으면 true를 반환해야 함', async () => {
        // Given
        const userId = 1;

        jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
        mockPrismaService.userInterestConcert.findFirst.mockResolvedValue({
          id: 1,
        });

        // When
        const result = await service.hasInterestConcertToast(userId);

        // Then
        expect(result).toBe(true);
        expect(mockPrismaService.userInterestConcert.findFirst).toHaveBeenCalledWith(
          {
            where: {
              userId,
              toastShown: false,
              concert: {
                status: {
                  in: [ConcertStatus.COMPLETED, ConcertStatus.CANCELED],
                },
              },
            },
            select: { id: true },
          },
        );
      });

      it('완료 또는 취소된 관심 콘서트가 없으면 false를 반환해야 함', async () => {
        // Given
        const userId = 1;

        jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
        mockPrismaService.userInterestConcert.findFirst.mockResolvedValue(null);

        // When
        const result = await service.hasInterestConcertToast(userId);

        // Then
        expect(result).toBe(false);
      });
    });

    describe('markInterestConcertToastAsShown', () => {
      it('노출되지 않은 완료/취소 관심 콘서트를 노출 처리해야 함', async () => {
        // Given
        const userId = 1;

        jest.spyOn(service, 'validateUser').mockResolvedValue(mockUser as any);
        mockPrismaService.userInterestConcert.findMany.mockResolvedValue([
          { id: 1 },
          { id: 2 },
        ]);
        mockPrismaService.userInterestConcert.updateMany.mockResolvedValue({
          count: 2,
        });

        // When
        await service.markInterestConcertToastAsShown(userId);

        // Then
        expect(mockPrismaService.userInterestConcert.findMany).toHaveBeenCalledWith(
          {
            where: {
              userId,
              toastShown: false,
              concert: {
                status: {
                  in: [ConcertStatus.COMPLETED, ConcertStatus.CANCELED],
                },
              },
            },
            select: { id: true },
          },
        );
        expect(mockPrismaService.userInterestConcert.updateMany).toHaveBeenCalledWith(
          {
            where: {
              id: { in: [1, 2] },
            },
            data: {
              toastShown: true,
            },
          },
        );
      });
    });

    describe('removeInterestConcertById', () => {
      it('관심 콘서트를 단건 삭제해야 함', async () => {
        // Given
        const userId = 1;
        const concertId = 13;
        const mockConcert = {
          id: concertId,
          code: 'C-002',
          title: '콘서트 B',
          artist: '아티스트 B',
          startDate: '2026.02.01',
          endDate: '2026.02.02',
          poster: null,
          status: 'UPCOMING',
          ticketSite: null,
          ticketUrl: null,
          venue: 'KSPO DOME',
          introduction: '소개',
          label: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.concert.findUnique.mockResolvedValue(mockConcert);
        mockPrismaService.userInterestConcert.deleteMany.mockResolvedValue({
          count: 1,
        });

        // When
        const result = await service.removeInterestConcertById(
          userId,
          concertId,
        );

        // Then
        expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: userId },
        });
        expect(mockPrismaService.concert.findUnique).toHaveBeenCalledWith({
          where: { id: concertId },
        });
        expect(mockPrismaService.userInterestConcert.deleteMany).toHaveBeenCalledWith(
          {
            where: {
              userId,
              concertId,
            },
          },
        );
        expect(result).toBeUndefined();
      });

      it('존재하지 않는 콘서트면 삭제 실패해야 함', async () => {
        // Given
        const userId = 1;
        const concertId = 999;

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.concert.findUnique.mockResolvedValue(null);

        // When & Then
        await expect(
          service.removeInterestConcertById(userId, concertId),
        ).rejects.toThrow(new NotFoundException(ErrorCode.CONCERT_NOT_FOUND));
      });
    });
  });
});
