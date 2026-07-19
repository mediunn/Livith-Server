import { Injectable, Logger } from '@nestjs/common';
import { ConcertRequestResult, ConcertStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import {
  EntryAlertItemDto,
  EntryAlertKind,
  EntryAlertResponseDto,
} from '../dto/response/entry-alert-response.dto';

type InterestConcertAlertRow = {
  id: number;
  concertTitle: string | null;
  concert: {
    title: string | null;
    status: ConcertStatus;
  };
};

type ConcertRequestAlertRow = {
  id: number;
  concertId: number | null;
  concertTitle: string;
  requestResult: ConcertRequestResult | null;
  concert: {
    title: string | null;
  } | null;
};

type RegisteredInterestConcertTitleRow = {
  concertId: number;
  concertTitle: string | null;
  concert: {
    title: string | null;
  };
};

const REQUEST_ALERT_TITLE_MAX_LENGTH = 19;

@Injectable()
export class EntryAlertService {
  private readonly logger = new Logger(EntryAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async getEntryAlertsAndMarkShown(
    userId: number,
  ): Promise<EntryAlertResponseDto> {
    await this.userService.validateUser(userId);

    return this.prisma.$transaction(async (tx) => {
      const interestConcerts = await tx.userInterestConcert.findMany({
        where: {
          userId,
          toastShown: false,
          concert: {
            status: {
              in: [ConcertStatus.COMPLETED, ConcertStatus.CANCELED],
            },
          },
        },
        select: {
          id: true,
          concertTitle: true,
          concert: {
            select: {
              title: true,
              status: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      const completedConcerts = interestConcerts.filter(
        (item) => item.concert.status === ConcertStatus.COMPLETED,
      );
      const canceledConcerts = interestConcerts.filter(
        (item) => item.concert.status === ConcertStatus.CANCELED,
      );

      const requests = await tx.concertRequest.findMany({
        where: {
          userId,
          registrationToastShown: false,
          requestResult: {
            not: null,
          },
        },
        select: {
          id: true,
          concertId: true,
          concertTitle: true,
          requestResult: true,
          concert: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const registeredConcertIds = requests
        .filter((request) => {
          return (
            request.requestResult === ConcertRequestResult.REGISTERED &&
            request.concertId !== null
          );
        })
        .map((request) => request.concertId as number);

      const registeredInterestConcerts =
        registeredConcertIds.length > 0
          ? await tx.userInterestConcert.findMany({
              where: {
                userId,
                concertId: { in: registeredConcertIds },
              },
              select: {
                concertId: true,
                concertTitle: true,
                concert: {
                  select: {
                    title: true,
                  },
                },
              },
            })
          : [];

      const registeredTitleByConcertId = this.buildRegisteredTitleMap(
        registeredInterestConcerts,
      );

      const items: EntryAlertItemDto[] = [];
      const consumedInterestConcertIds: number[] = [];
      const processedRequestIds: number[] = [];

      const completedItem = this.buildAutoRemovedItem(
        EntryAlertKind.AUTO_REMOVED_COMPLETED,
        completedConcerts,
      );

      if (completedItem) {
        items.push(completedItem);
        consumedInterestConcertIds.push(
          ...completedConcerts.map((item) => item.id),
        );
      }

      const canceledItem = this.buildAutoRemovedItem(
        EntryAlertKind.AUTO_REMOVED_CANCELED,
        canceledConcerts,
      );
      if (canceledItem) {
        items.push(canceledItem);
        consumedInterestConcertIds.push(
          ...canceledConcerts.map((item) => item.id),
        );
      }

      for (const request of requests) {
        const item = this.buildRequestItem(request, registeredTitleByConcertId);
        processedRequestIds.push(request.id);

        if (!item) continue;

        items.push(item);
      }

      if (consumedInterestConcertIds.length > 0) {
        await tx.userInterestConcert.updateMany({
          where: {
            id: { in: consumedInterestConcertIds },
          },
          data: {
            toastShown: true,
          },
        });
      }

      if (processedRequestIds.length > 0) {
        await tx.concertRequest.updateMany({
          where: {
            id: { in: processedRequestIds },
          },
          data: {
            registrationToastShown: true,
          },
        });
      }

      return new EntryAlertResponseDto(items);
    });
  }

  private buildAutoRemovedItem(
    kind:
      | EntryAlertKind.AUTO_REMOVED_COMPLETED
      | EntryAlertKind.AUTO_REMOVED_CANCELED,
    concerts: InterestConcertAlertRow[],
  ): EntryAlertItemDto | null {
    if (concerts.length === 0) return null;

    const count = concerts.length;
    const representativeTitle = this.getInterestConcertTitle(concerts[0]);

    if (kind === EntryAlertKind.AUTO_REMOVED_COMPLETED) {
      return {
        kind,
        title: `자동 정리된 공연 ${count}`,
        content:
          count === 1
            ? `${this.withSubjectParticle(representativeTitle)} 자동 정리 됐어요`
            : `${representativeTitle} 외 ${count - 1}건이 자동 정리 됐어요`,
      };
    }

    return {
      kind,
      title: `취소된 공연 ${count}`,
      content:
        count === 1
          ? `${this.withSubjectParticle(representativeTitle)} 취소되어 자동 정리 됐어요`
          : `${representativeTitle} 외 ${count - 1}건이 취소되어 자동 정리 됐어요`,
    };
  }

  private buildRequestItem(
    request: ConcertRequestAlertRow,
    registeredTitleByConcertId: Map<number, string>,
  ): EntryAlertItemDto | null {
    switch (request.requestResult) {
      case ConcertRequestResult.REGISTERED:
        if (!request.concertId) {
          this.logger.warn(
            `REGISTERED concert request has no concertId, requestId=${request.id}`,
          );
          return null;
        }

        if (!registeredTitleByConcertId.has(request.concertId)) {
          this.logger.warn(
            `REGISTERED concert request has no userInterestConcert row. requestId=${request.id}, concertId=${request.concertId}`,
          );
        }

        return {
          kind: EntryAlertKind.REQUEST_REGISTERED,
          title: this.truncateRequestAlertTitle(
            registeredTitleByConcertId.get(request.concertId) ??
              request.concert?.title ??
              request.concertTitle,
          ),
          content: `나의 관심 콘서트에 추가됐어요`,
          concertId: request.concertId,
        };

      case ConcertRequestResult.UNSUPPORTED_GENRE:
        return {
          kind: EntryAlertKind.REQUEST_FAILED,
          title: this.truncateRequestAlertTitle(request.concertTitle),
          content: '장르가 없어 관심 콘서트에 추가되지 않았어요',
        };

      case ConcertRequestResult.PAST_CONCERT:
        return {
          kind: EntryAlertKind.REQUEST_FAILED,
          title: this.truncateRequestAlertTitle(request.concertTitle),
          content: '지난 공연으로 관심 콘서트에 추가되지 않았어요',
        };

      case ConcertRequestResult.INSUFFICIENT_INFORMATION:
        return {
          kind: EntryAlertKind.REQUEST_FAILED,
          title: this.truncateRequestAlertTitle(request.concertTitle),
          content: '정확한 정보가 부족하여 추가되지 않았어요',
        };

      default:
        return null;
    }
  }

  private getInterestConcertTitle(item: InterestConcertAlertRow): string {
    return item.concertTitle ?? item.concert.title ?? '공연';
  }

  private buildRegisteredTitleMap(
    interests: RegisteredInterestConcertTitleRow[],
  ): Map<number, string> {
    return new Map(
      interests.map((interest) => [
        interest.concertId,
        interest.concertTitle ?? interest.concert.title ?? '공연',
      ]),
    );
  }

  private truncateRequestAlertTitle(title: string): string {
    const trimmedTitle = title.trim();

    if (trimmedTitle.length <= REQUEST_ALERT_TITLE_MAX_LENGTH) {
      return trimmedTitle;
    }

    return `${trimmedTitle.slice(0, REQUEST_ALERT_TITLE_MAX_LENGTH)}...`;
  }

  private withSubjectParticle(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) {
      return '';
    }
    const lastChar = trimmed.charCodeAt(trimmed.length - 1);

    if (lastChar < 0xac00 || lastChar > 0xd7a3) {
      return `${trimmed}이`;
    }

    const hasBatchim = (lastChar - 0xac00) % 28 !== 0;
    return `${trimmed}${hasBatchim ? '이' : '가'}`;
  }
}
