import { Test, TestingModule } from '@nestjs/testing';
import { ConcertRequestResult, ConcertStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { EntryAlertKind } from '../dto/response/entry-alert-response.dto';
import { EntryAlertService } from '../service/entry-alert.service';

describe('EntryAlertService', () => {
  let service: EntryAlertService;
  let mockTx: any;
  let mockPrisma: any;
  let mockUserService: {
    validateUser: jest.Mock;
  };

  beforeEach(async () => {
    mockTx = {
      userInterestConcert: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      concertRequest: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    mockPrisma = {
      $transaction: jest.fn((callback: (tx: any) => Promise<unknown>) =>
        callback(mockTx),
      ),
    };

    mockUserService = {
      validateUser: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntryAlertService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    service = module.get<EntryAlertService>(EntryAlertService);
  });

  it('앱 진입 알림을 만들고 응답된 데이터만 노출 완료 처리한다', async () => {
    const registeredTitle = '12345678901234567890등록공연';
    const failedTitle = '12345678901234567890실패공연';

    mockTx.userInterestConcert.findMany
      .mockResolvedValueOnce([
        {
          id: 1,
          concertTitle: '완료 공연 A',
          concert: { title: '최신 완료 공연 A' },
        },
        {
          id: 2,
          concertTitle: '완료 공연 B',
          concert: { title: '최신 완료 공연 B' },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 3,
          concertTitle: '취소 공연',
          concert: { title: '최신 취소 공연' },
        },
      ])
      .mockResolvedValueOnce([
        {
          concertId: 55,
          concertTitle: registeredTitle,
          concert: { title: '최신 등록 공연' },
        },
      ]);

    mockTx.concertRequest.findMany.mockResolvedValue([
      {
        id: 10,
        concertId: 55,
        concertTitle: '요청 등록 공연',
        requestResult: ConcertRequestResult.REGISTERED,
        concert: { title: '요청 등록 공연 최신 제목' },
      },
      {
        id: 11,
        concertId: null,
        concertTitle: failedTitle,
        requestResult: ConcertRequestResult.INSUFFICIENT_INFORMATION,
        concert: null,
      },
    ]);

    mockTx.userInterestConcert.updateMany.mockResolvedValue({ count: 3 });
    mockTx.concertRequest.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.getEntryAlertsAndMarkShown(1);

    expect(mockUserService.validateUser).toHaveBeenCalledWith(1);

    expect(mockTx.userInterestConcert.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          userId: 1,
          toastShown: false,
          concert: {
            status: ConcertStatus.COMPLETED,
          },
        },
      }),
    );

    expect(mockTx.userInterestConcert.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          userId: 1,
          toastShown: false,
          concert: {
            status: ConcertStatus.CANCELED,
          },
        },
      }),
    );

    expect(mockTx.concertRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 1,
          registrationToastShown: false,
          requestResult: {
            not: null,
          },
        },
      }),
    );

    expect(result.items).toEqual([
      {
        kind: EntryAlertKind.AUTO_REMOVED_COMPLETED,
        title: '자동 정리된 공연 2',
        content: '완료 공연 A 외 1건이 자동 정리 됐어요',
      },
      {
        kind: EntryAlertKind.AUTO_REMOVED_CANCELED,
        title: '취소된 공연 1',
        content: '취소 공연이 취소되어 자동 정리 됐어요',
      },
      {
        kind: EntryAlertKind.REQUEST_REGISTERED,
        title: `${registeredTitle.slice(0, 19)}...`,
        content: '나의 관심 콘서트에 추가됐어요',
        concertId: 55,
      },
      {
        kind: EntryAlertKind.REQUEST_FAILED,
        title: `${failedTitle.slice(0, 19)}...`,
        content: '정확한 정보가 부족하여 추가되지 않았어요',
      },
    ]);

    expect(mockTx.userInterestConcert.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: [1, 2, 3] },
      },
      data: {
        toastShown: true,
      },
    });

    expect(mockTx.concertRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: [10, 11] },
      },
      data: {
        registrationToastShown: true,
      },
    });
  });

  it('보여줄 알림이 없으면 빈 items를 반환하고 update를 호출하지 않는다', async () => {
    mockTx.userInterestConcert.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    mockTx.concertRequest.findMany.mockResolvedValue([]);

    const result = await service.getEntryAlertsAndMarkShown(1);

    expect(result.items).toEqual([]);
    expect(mockTx.userInterestConcert.updateMany).not.toHaveBeenCalled();
    expect(mockTx.concertRequest.updateMany).not.toHaveBeenCalled();
  });

  it('요청 결과 제목이 19자 이하면 말줄임하지 않는다', async () => {
    const title19 = '1234567890123456789';

    mockTx.userInterestConcert.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          concertId: 55,
          concertTitle: title19,
          concert: { title: '최신 공연명' },
        },
      ]);

    mockTx.concertRequest.findMany.mockResolvedValue([
      {
        id: 10,
        concertId: 55,
        concertTitle: '요청 공연명',
        requestResult: ConcertRequestResult.REGISTERED,
        concert: { title: '최신 공연명' },
      },
    ]);

    const result = await service.getEntryAlertsAndMarkShown(1);

    expect(result.items).toEqual([
      {
        kind: EntryAlertKind.REQUEST_REGISTERED,
        title: title19,
        content: '나의 관심 콘서트에 추가됐어요',
        concertId: 55,
      },
    ]);

    expect(mockTx.userInterestConcert.updateMany).not.toHaveBeenCalled();
    expect(mockTx.concertRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: [10] },
      },
      data: {
        registrationToastShown: true,
      },
    });
  });
});
