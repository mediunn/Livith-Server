import { Test, TestingModule } from '@nestjs/testing';
import { ConcertService } from './concert.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertStatus } from '@prisma/client';
import { BadRequestException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';

describe('ConcertService', () => {
  let service: ConcertService;
  let mockPrismaService: {
    concert: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const mockConcerts = [
    {
      id: 1,
      startDate: '2026.04.10',
      endDate: '2026.04.11',
      status: ConcertStatus.ONGOING,
      artist: '아티스트1',
      introduction: 'intro1',
      title: '콘서트1',
      poster: null,
      ticketSite: null,
      ticketUrl: null,
      venue: null,
      label: null,
      code: null,
      artistId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      startDate: null,
      endDate: '2026.04.12',
      status: ConcertStatus.UPCOMING,
      artist: '아티스트2',
      introduction: 'intro2',
      title: '콘서트2',
      poster: null,
      ticketSite: null,
      ticketUrl: null,
      venue: null,
      label: null,
      code: null,
      artistId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    mockPrismaService = {
      concert: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConcertService>(ConcertService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConcerts', () => {
    it('startDate가 null인 콘서트는 맨 뒤로 정렬해야 함', async () => {
      // Given
      mockPrismaService.concert.findMany.mockResolvedValue(mockConcerts);

      // When
      const result = await service.getConcerts(undefined, 10);

      // Then
      expect(mockPrismaService.concert.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: [ConcertStatus.ONGOING, ConcertStatus.UPCOMING] },
        },
        orderBy: [{ startDate: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
        cursor: undefined,
        take: 10,
        skip: 0,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
      expect(result.cursor).toBe(2);
    });

    it('잘못된 cursor를 받으면 예외를 던져야 함', async () => {
      // Given
      mockPrismaService.concert.findUnique.mockResolvedValue(null);

      // When & Then
      await expect(service.getConcerts(999, 10)).rejects.toThrow(
        new BadRequestException(ErrorCode.CONCERT_NOT_FOUND),
      );

      expect(mockPrismaService.concert.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        select: { startDate: true },
      });
    });
  });
});
