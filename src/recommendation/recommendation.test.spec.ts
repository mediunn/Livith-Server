import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationService } from './services/recommendation.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LastfmApiService } from './integrations/lastfm/last-fm.api.service';
import { ConcertStatus, Provider } from '@prisma/client';

// Log
function logConcerts(
  concerts: {
    title: string;
    artist: string;
    status?: ConcertStatus;
    daysLeft?: number;
  }[],
) {
  console.log(`추천된 콘서트 : ${concerts.length}개\n`);
  concerts.forEach((concert, index) => {
    console.log(
      `${index + 1}. ${concert.title} - ${concert.artist} (status: ${concert.status}, daysLeft: ${concert.daysLeft})`,
    );
  });
}

// 최대 3명 뽑기
function pickArtists<T extends { artistName: string }>(artists: T[]) {
  const uniqueByName = new Map<string, T>();
  for (const a of artists) {
    if (!uniqueByName.has(a.artistName)) uniqueByName.set(a.artistName, a);
  }
  return Array.from(uniqueByName.values()).slice(0, 3);
}

describe('RecommendationService Integration Test', () => {
  let service: RecommendationService;
  let prismaService: PrismaService;
  let testUserId: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [RecommendationService, PrismaService, LastfmApiService],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    prismaService = module.get<PrismaService>(PrismaService);

    // 테스트용 유저 생성
    const testUser = await prismaService.user.create({
      data: {
        provider: Provider.kakao,
        providerId: `test_${Date.now()}_${Math.random()}`,
        nickname: `test_user_${Date.now()}`,
        marketingConsent: false,
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    if (testUserId) {
      await prismaService.userGenre.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.userArtist.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.user.delete({
        where: { id: testUserId },
      });
    }
    await prismaService.$disconnect();
  });

  // DB 추출 메서드
  const fetchSelectedArtists = async (names: string[]) => {
    const representativeArtists =
      await prismaService.representativeArtist.findMany({
        where: { artistName: { in: names } },
        include: { genre: true },
      });
    return pickArtists(representativeArtists);
  };

  // 유저 취향 세팅 메서드
  const setupUserPreferences = async (
    artists: any[] = [],
    genres: any[] = [],
  ) => {
    // Log
    if (artists.length > 0) {
      console.log(`선택한 아티스트 (${artists.length}개)\n`);
      artists.forEach((artist, index) => {
        console.log(
          `${index + 1}. ${artist.artistName} (장르: ${artist.genre.name}, ID: ${artist.id})`,
        );
      });
    }
    if (genres.length > 0) {
      console.log(`선택한 장르 (${genres.length}개)\n`);
      genres.forEach((genre, index) => {
        console.log(`${index + 1}. ${genre.name} (ID: ${genre.id})`);
      });
    }

    // Delete & Insert
    await prismaService.userGenre.deleteMany({ where: { userId: testUserId } });
    await prismaService.userArtist.deleteMany({
      where: { userId: testUserId },
    });

    for (const artist of artists) {
      await prismaService.userArtist.create({
        data: {
          userId: testUserId,
          artistId: artist.id,
          artistName: artist.artistName,
        },
      });
    }
    for (const genre of genres) {
      await prismaService.userGenre.create({
        data: {
          userId: testUserId,
          genreId: genre.id,
          genreName: genre.name as any,
        },
      });
    }
  };

  // UPCOMING/ONGOING 검증 로직
  const verifyRecommendations = async () => {
    const recommendedConcerts = await service.getRecommendConcerts(testUserId);
    expect(recommendedConcerts).toBeDefined();
    expect(Array.isArray(recommendedConcerts)).toBe(true);

    logConcerts(recommendedConcerts);

    expect(
      recommendedConcerts.every(
        (c) =>
          c.status === ConcertStatus.UPCOMING ||
          c.status === ConcertStatus.ONGOING,
      ),
    ).toBe(true);
  };

  it('米津玄師, 宇多田ヒカル, 杏里 선택 시 추천 콘서트 조회', async () => {
    // Given: 일본어 아티스트들
    const selectedArtists = await fetchSelectedArtists([
      '米津玄師',
      '宇多田ヒカル',
      '杏里',
    ]);

    await setupUserPreferences(selectedArtists);
    await verifyRecommendations();
  }, 30000);

  it('장르 선택 시 추천 콘서트 조회', async () => {
    // Given: 실제 DB에서 장르 조회(J_POP, ROCK_METAL, RAP_HIPHOP)
    const genres = await prismaService.genre.findMany({
      take: 3,
    });

    await setupUserPreferences([], genres);
    await verifyRecommendations();
  }, 30000);

  it('Radiohead, Paramore, Coldplay 선택 시 추천 콘서트 조회', async () => {
    // Given: ROCK_METAL 장르 아티스트들
    const selectedArtists = await fetchSelectedArtists([
      'Radiohead',
      'Paramore',
      'Coldplay',
    ]);

    await setupUserPreferences(selectedArtists);
    await verifyRecommendations();
  }, 30000);

  it('Lisa, YOASOBI, 米津玄師 선택 시 추천 콘서트 조회', async () => {
    // Given: JPOP 장르 아티스트들
    const selectedArtists = await fetchSelectedArtists([
      'Lisa',
      'YOASOBI',
      '米津玄師',
    ]);

    await setupUserPreferences(selectedArtists);
    await verifyRecommendations();
  }, 30000);

  it('Frank Sinatra, Steve Lacy, Laufey 선택 시 추천 콘서트 조회', async () => {
    // Given: CLASSIC_JAZZ 장르 아티스트들
    const selectedArtists = await fetchSelectedArtists([
      'Frank Sinatra',
      'Steve Lacy',
      'Laufey',
    ]);

    await setupUserPreferences(selectedArtists);
    await verifyRecommendations();
  }, 30000);

  it('Ed Sheeran, Jack Johnson, John Mayer 선택 시 추천 콘서트 조회', async () => {
    // Given: ACOUSTIC 장르 아티스트들
    const selectedArtists = await fetchSelectedArtists([
      'Ed Sheeran',
      'Jack Johnson',
      'John Mayer',
    ]);

    await setupUserPreferences(selectedArtists);
    await verifyRecommendations();
  }, 30000);

  it('여러 장르 아티스트 혼합 선택 시 추천 콘서트 조회', async () => {
    // Given: 여러 장르에서 아티스트 혼합 선택
    const selectedArtists = await fetchSelectedArtists([
      '21 Savage',
      'Radiohead',
      'Lisa',
    ]);

    await setupUserPreferences(selectedArtists);
    await verifyRecommendations();
  }, 30000);

  it('장르 1개 + 아티스트 2개 섞어서 선택 시 추천 콘서트 조회', async () => {
    // Given: 장르 1개 + 아티스트 2개 선택
    const genres = await prismaService.genre.findMany({ take: 1 });
    const artistNames = ['21 Savage', 'Kanye West'];
    const representativeArtists =
      await prismaService.representativeArtist.findMany({
        where: {
          artistName: { in: artistNames },
        },
        include: { genre: true },
      });

    const selectedArtists = representativeArtists.slice(0, 2);

    await setupUserPreferences(selectedArtists, [genres[0]]);
    await verifyRecommendations();
  }, 30000);
});
