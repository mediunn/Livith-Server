import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { ArtistMatchingService } from './artist-matching.service';

describe('ArtistMatchingService', () => {
  let service: ArtistMatchingService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      representativeArtist: {
        findMany: jest.fn(),
      },
      userArtist: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistMatchingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ArtistMatchingService>(ArtistMatchingService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMatchingRepresentativeArtistIds', () => {
    it('정규화된 이름이 일치하는 아티스트 id 반환', async () => {
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([
        { id: 1, artistName: 'NewJeans' },
        { id: 2, artistName: 'IVE' },
        { id: 3, artistName: 'aespa' },
      ]);

      const result =
        await service.findMatchingRepresentativeArtistIds('NewJeans');

      expect(result).toEqual([1]);
    });

    it('대소문자/공백 차이 무시하고 매칭', async () => {
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([
        { id: 1, artistName: 'NewJeans' },
        { id: 2, artistName: 'IVE' },
      ]);

      const result =
        await service.findMatchingRepresentativeArtistIds('  newjeans  ');

      expect(result).toEqual([1]);
    });

    it('이름 끝 괄호 블록 무시하고 매칭 (e.g. "IVE (아이브)" → "IVE")', async () => {
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([
        { id: 1, artistName: 'IVE' },
        { id: 2, artistName: 'aespa' },
      ]);

      const result =
        await service.findMatchingRepresentativeArtistIds('IVE (아이브)');

      expect(result).toEqual([1]);
    });

    it('일치하는 아티스트 없으면 빈 배열', async () => {
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([
        { id: 1, artistName: 'NewJeans' },
        { id: 2, artistName: 'IVE' },
      ]);

      const result =
        await service.findMatchingRepresentativeArtistIds('Unknown');

      expect(result).toEqual([]);
    });

    it('동일 정규화 결과인 아티스트 여러 명이면 모두 반환', async () => {
      mockPrismaService.representativeArtist.findMany.mockResolvedValue([
        { id: 1, artistName: 'IVE' },
        { id: 2, artistName: 'IVE (아이브)' },
        { id: 3, artistName: 'aespa' },
      ]);

      const result = await service.findMatchingRepresentativeArtistIds('IVE');

      expect(result).toEqual([1, 2]);
    });
  });

  describe('findUserIdsByArtistIds', () => {
    it('빈 artistIds 입력 시 DB 조회 안 하고 빈 배열 반환', async () => {
      const result = await service.findUserIdsByArtistIds([]);

      expect(result).toEqual([]);
      expect(mockPrismaService.userArtist.findMany).not.toHaveBeenCalled();
    });

    it('artistIds 에 매칭되는 userId 목록 반환', async () => {
      mockPrismaService.userArtist.findMany.mockResolvedValue([
        { userId: 10 },
        { userId: 20 },
        { userId: 30 },
      ]);

      const result = await service.findUserIdsByArtistIds([1, 2]);

      expect(result).toEqual([10, 20, 30]);
      expect(mockPrismaService.userArtist.findMany).toHaveBeenCalledWith({
        where: {
          artistId: { in: [1, 2] },
          user: { deletedAt: null },
        },
        select: { userId: true },
      });
    });

    it('동일 userId 중복 제거', async () => {
      mockPrismaService.userArtist.findMany.mockResolvedValue([
        { userId: 10 },
        { userId: 20 },
        { userId: 10 },
        { userId: 30 },
        { userId: 20 },
      ]);

      const result = await service.findUserIdsByArtistIds([1, 2, 3]);

      expect(result).toEqual([10, 20, 30]);
    });

    it('매칭 없으면 빈 배열', async () => {
      mockPrismaService.userArtist.findMany.mockResolvedValue([]);

      const result = await service.findUserIdsByArtistIds([999]);

      expect(result).toEqual([]);
    });
  });
});