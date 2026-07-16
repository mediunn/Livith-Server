import { Test, TestingModule } from '@nestjs/testing';
import { ConcertService } from './concert.service';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertStatus } from '@prisma/client';
import {
  BadRequestException,
  NotFoundException,
} from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { UserService } from 'src/user/user.service';
import { ConcertRequestDiscordService } from './concert-request-discord.service';
import { RequestConcertInfoResponseDto } from './dto/request-concert-info-response.dto';

describe('ConcertService', () => {
  let service: ConcertService;
  let mockPrismaService: {
    concert: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    concertRequest: {
      create: jest.Mock;
    };
  };
  let mockUserService: {
    validateUser: jest.Mock;
  };
  let mockDiscordService: {
    notifyConcertRequest: jest.Mock;
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
      concertRequest: {
        create: jest.fn(),
      },
    };
    mockUserService = {
      validateUser: jest.fn(),
    };
    mockDiscordService = {
      notifyConcertRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConcertRequestDiscordService,
          useValue: mockDiscordService,
        },
      ],
    }).compile();

    service = module.get<ConcertService>(ConcertService);
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

  describe('requestConcertInfo', () => {
    const userId = 10;
    const autoRegister = true;
    const title = '테일러 스위프트 콘서트';
    const url = 'https://www.example.com/concert/1';
    const requestContent = '아티스트명: 테일러 스위프트';

    const mockConcertRequest = {
      id: 1,
      userId,
      autoRegister,
      concertTitle: title,
      url,
      requestContent,
      registrationToastShown: false,
      requestResult: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('콘서트 요청을 저장하고 디스코드 알림 후 응답 DTO를 반환해야 함', async () => {
      // Given
      const nickname = '테스트유저';
      mockUserService.validateUser.mockResolvedValue({
        id: userId,
        nickname,
      });
      mockPrismaService.concertRequest.create.mockResolvedValue(
        mockConcertRequest,
      );
      mockDiscordService.notifyConcertRequest.mockResolvedValue(undefined);

      // When
      const result = await service.requestConcertInfo(
        userId,
        autoRegister,
        title,
        url,
        requestContent,
      );

      // Then
      expect(mockUserService.validateUser).toHaveBeenCalledWith(userId);
      expect(mockPrismaService.concertRequest.create).toHaveBeenCalledWith({
        data: {
          userId,
          autoRegister,
          concertTitle: title,
          url,
          requestContent,
        },
      });
      expect(mockDiscordService.notifyConcertRequest).toHaveBeenCalledWith({
        id: mockConcertRequest.id,
        userId: mockConcertRequest.userId,
        userNickname: nickname,
        concertTitle: mockConcertRequest.concertTitle,
        url: mockConcertRequest.url,
        requestContent: mockConcertRequest.requestContent,
        autoRegister: mockConcertRequest.autoRegister,
      });
      expect(result).toBeInstanceOf(RequestConcertInfoResponseDto);
      expect(result).toEqual({
        id: 1,
        userId,
        autoRegister,
        title,
        url,
        requestContent,
      });
    });

    it('유효하지 않은 유저면 NotFoundException을 던지고 저장/알림을 하지 않아야 함', async () => {
      // Given
      mockUserService.validateUser.mockResolvedValue(null);

      // When & Then
      await expect(
        service.requestConcertInfo(
          userId,
          autoRegister,
          title,
          url,
          requestContent,
        ),
      ).rejects.toThrow(new NotFoundException(ErrorCode.USER_NOT_FOUND));

      expect(mockPrismaService.concertRequest.create).not.toHaveBeenCalled();
      expect(mockDiscordService.notifyConcertRequest).not.toHaveBeenCalled();
    });
  });
});
