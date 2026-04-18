import { PrismaService } from 'prisma/prisma.service';
import { ArtistSyncService } from '../services/artist-sync.service';
import { Test } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LastfmApiService } from '../integrations/lastfm/last-fm.api.service';
import { YoutubeApiService } from '../integrations/youtube/youtube.api.service';
import { ArtistImageService } from '../services/artist-image.service';

// API + Mock DB
describe('ArtistSyncService Logic Test ', () => {
  let service: ArtistSyncService;
  let prismaService: jest.Mocked<PrismaService>;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      genre: {
        findMany: jest.fn(),
      },
      representativeArtist: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      imports: [HttpModule, ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        ArtistSyncService,
        LastfmApiService,
        YoutubeApiService,
        ArtistImageService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ArtistSyncService);
    prismaService = module.get(PrismaService);
  });

  it('전체 5개 장르에서 각 200명씩 총 1000명 가져오기', async () => {
    // Given:
    mockPrisma.genre.findMany.mockResolvedValue([
      { id: 1, name: 'JPOP' },
      { id: 2, name: 'ROCK_METAL' },
      { id: 3, name: 'RAP_HIPHOP' },
      { id: 4, name: 'POP' },
      { id: 5, name: 'INDIE' },
    ] as any);

    mockPrisma.representativeArtist.upsert.mockResolvedValue({} as any);

    // When: 실제 동기화 실행
    await service.syncRepresentativeArtists();

    // Then: DB upsert가 호출되었는지 검증
    const totalCalls = mockPrisma.representativeArtist.upsert.mock.calls.length;

    expect(prismaService.genre.findMany).toHaveBeenCalled();
    expect(prismaService.representativeArtist.upsert).toHaveBeenCalled();

    console.log(`총 ${totalCalls}명 아티스트 저장`);
  }, 60000);

  it('장르별로 200명씩 가져오는지 확인', async () => {
    // Given
    mockPrisma.genre.findMany.mockResolvedValue([
      { id: 1, name: 'JPOP' },
      { id: 2, name: 'ROCK_METAL' },
    ] as any);

    const genreArtistCount = new Map();

    mockPrisma.representativeArtist.upsert.mockImplementation(
      async (args: any) => {
        const genreId = args.where.genreId_artistName.genreId;
        genreArtistCount.set(genreId, (genreArtistCount.get(genreId) || 0) + 1);
        return {} as any;
      },
    );

    // When
    await service.syncRepresentativeArtists();

    // Then
    expect(genreArtistCount.get(1)).toBe(200);
    expect(genreArtistCount.get(2)).toBe(200);

    console.log('장르별 아티스트 수:', Object.fromEntries(genreArtistCount));
  }, 60000);

  // Upsert 로직 검증
  it('첫 번째 실행: 모든 아티스트 Create', async () => {
    // Given
    mockPrisma.genre.findMany.mockResolvedValue([
      { id: 1, name: 'JPOP' },
    ] as any);

    let createCount = 0;

    mockPrisma.representativeArtist.upsert.mockImplementation(
      async (args: any) => {
        createCount++;
        return { ...args.create, id: createCount } as any;
      },
    );

    // When
    await service.syncRepresentativeArtists();

    // Then
    expect(createCount).toBe(200);

    // create 구조 검증
    const firstCall = mockPrisma.representativeArtist.upsert.mock.calls[0][0];
    expect(firstCall.create).toMatchObject({
      genreId: 1,
      artistName: expect.any(String),
      imgUrl: '', // 빈값
    });
  }, 60000);

  it('2차 실행: 기존 아티스트는 Update만, imgUrl 유지', async () => {
    // Given
    mockPrisma.genre.findMany.mockResolvedValue([
      { id: 1, name: 'JPOP' },
    ] as any);

    const mockDb = new Map(); // DB 시뮬레이션

    mockPrisma.representativeArtist.upsert.mockImplementation(
      async (args: any) => {
        const key = `${args.where.genreId_artistName.genreId}-${args.where.genreId_artistName.artistName}`;

        if (!mockDb.has(key)) {
          // 1차: create
          mockDb.set(key, { ...args.create, id: mockDb.size + 1 });
        } else {
          // 2차: update (imgUrl 유지)
          const existing = mockDb.get(key);
          mockDb.set(key, { ...existing, updatedAt: new Date() });
        }
        return mockDb.get(key);
      },
    );

    // When: 1차 실행
    await service.syncRepresentativeArtists();
    const firstCount = mockDb.size;

    // When: 2차 실행 (6개월 후)
    await service.syncRepresentativeArtists();
    const secondCount = mockDb.size;

    // Then
    expect(firstCount).toBe(200);
    expect(secondCount).toBe(200); // 동일

    const allArtists = Array.from(mockDb.values());
    expect(allArtists.every((a) => a.imgUrl === '')).toBe(true);
  }, 60000);

  it('이미지 없는 아티스트 90개씩 처리', async () => {
    // Given: 90명 아티스트 (이미지 없음, genre 포함)
    const mockArtists = Array.from({ length: 90 }, (_, i) => ({
      id: i + 1,
      artistName: `Artist${i + 1}`,
      imgUrl: '',
      genre: { imgUrl: 'genre-default.jpg' },
    }));

    mockPrisma.representativeArtist.findMany.mockResolvedValue(
      mockArtists as any,
    );
    mockPrisma.representativeArtist.update.mockResolvedValue({} as any);

    // When
    await service.syncArtistImages();

    // Then: 90개만 처리
    expect(prismaService.representativeArtist.findMany).toHaveBeenCalledWith({
      where: { OR: [{ imgUrl: '' }, { imgUrl: null }] },
      take: 90,
      orderBy: { createdAt: 'asc' },
      include: { genre: true },
    });

    expect(prismaService.representativeArtist.update).toHaveBeenCalledTimes(90);
  }, 60000);

  it('이미지 모두 있으면 즉시 종료', async () => {
    // Given: 이미지 없는 아티스트 0명
    mockPrisma.representativeArtist.findMany.mockResolvedValue([]);

    // When
    await service.syncArtistImages();

    // Then: update 호출 안됨
    expect(prismaService.representativeArtist.update).not.toHaveBeenCalled();
  }, 60000);

  it('장르명이 Last.fm 태그로 정확히 변환되는지 확인', async () => {
    // Given
    mockPrisma.genre.findMany.mockResolvedValue([
      { id: 1, name: 'JPOP' },
      { id: 2, name: 'ROCK_METAL' },
      { id: 3, name: 'POP' },
    ] as any);

    const apiCalls: string[] = [];

    // lastfmApiService를 spy로 감시
    jest
      .spyOn(service['lastfmApiService'], 'getTopArtistByTag')
      .mockImplementation(async (tag: string) => {
        apiCalls.push(tag);
        return [];
      });

    // When
    await service.syncRepresentativeArtists();

    // Then
    expect(apiCalls).toContain('j-pop');
    expect(apiCalls).toContain('rock');
    expect(apiCalls).toContain('pop');
  }, 60000);
});
