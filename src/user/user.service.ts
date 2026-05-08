import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getDaysUntil } from '../common/utils/date.util';
import { UserResponseDto } from './dto/user-response.dto';
import { Prisma, Provider, User } from '@prisma/client';
import { UserGenreResponseDto } from './dto/user-genre-response.dto';
import { UserArtistResponseDto } from './dto/user-artist-response.dto';
import { GetInterestConcertsDto } from './dto/get-interest-concerts.dto';
import { InterestConcertSort } from 'src/common/enums/interest-concert-sort.enum';
import { InterestConcertResponseDto } from './dto/interest-concert-response.dto';
import { ConcertStatus } from '../common/enums/concert-status.enum';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 유저 검증 (public 메서드)
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    return user;
  }

  //관심 콘서트 추가
  async setInterestConcerts(concertIds: number[], userId: number) {
    const uniqueConcertIds = [...new Set(concertIds)];
    const concerts = await this.prismaService.concert.findMany({
      where: { id: { in: uniqueConcertIds } },
    });
    if (concerts.length !== uniqueConcertIds.length) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    const user = await this.validateUser(userId);

    await this.prismaService.$transaction(async (tx) => {
      await tx.userInterestConcert.deleteMany({
        where: { userId },
      });
      const createData = concerts.map((concert) => ({
        userId,
        concertId: concert.id,
        concertTitle: concert.title,
        userNickname: user.nickname,
      }));
      await tx.userInterestConcert.createMany({
        data: createData,
      });
    });
    return concerts.map((concert) => new ConcertResponseDto(concert));
  }

  //관심 콘서트 단건 추가
  async addInterestConcertById(userId: number, concertId: number) {
    const user = await this.validateUser(userId);

    const concert = await this.prismaService.concert.findUnique({
      where: { id: concertId },
    });

    if (!concert) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    await this.prismaService.userInterestConcert.createMany({
      data: [
        {
          userId,
          concertId: concert.id,
          concertTitle: concert.title,
          userNickname: user.nickname,
        },
      ],
      skipDuplicates: true,
    });

    return new ConcertResponseDto(concert, getDaysUntil(concert.startDate));
  }

  // 유저의 관심 콘서트 여부 확인
  async checkInterestConcert(userId: number, concertId: number) {
    await this.validateUser(userId);

    const interestConcert =
      await this.prismaService.userInterestConcert.findFirst({
        where: {
          userId,
          concertId,
        },
        select: { id: true },
      });

    return {
      isInterested: Boolean(interestConcert),
    };
  }

  // 관심 콘서트 토스트 노출 여부 확인
  async getInterestConcertToastStatus(
    userId: number,
  ): Promise<{ needsToShow: boolean }> {
    await this.validateUser(userId);

    const interestConcert =
      await this.prismaService.userInterestConcert.findFirst({
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
      });

    return { needsToShow: Boolean(interestConcert) };
  }

  // 관심 콘서트 토스트 노출 처리
  async patchInterestConcertToastStatus(userId: number): Promise<void> {
    await this.validateUser(userId);

    const interestConcerts =
      await this.prismaService.userInterestConcert.findMany({
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
      });

    if (interestConcerts.length === 0) {
      return;
    }

    await this.prismaService.userInterestConcert.updateMany({
      where: {
        id: { in: interestConcerts.map((item) => item.id) },
      },
      data: {
        toastShown: true,
      },
    });
  }

  //관심 콘서트 목록 조회
  async getInterestConcerts(
    query: GetInterestConcertsDto | undefined,
    userId: number,
  ) {
    await this.validateUser(userId);

    const {
      cursorDate,
      cursorId,
      size,
      sort = InterestConcertSort.CONCERT,
    } = query ?? {};

    // 예매일 기준
    if (sort === InterestConcertSort.TICKETING) {
      return this.getInterestConcertsByTicketing(
        userId,
        cursorDate,
        cursorId,
        size,
      );
    }

    // 공연일 기준 (기본값)
    return this.getInterestConcertsByConcertDate(
      userId,
      cursorDate,
      cursorId,
      size,
    );
  }

  private async getInterestConcertsByConcertDate(
    userId: number,
    cursorDate?: string,
    cursorId?: number,
    size?: number,
  ) {
    const hasSize = typeof size === 'number';

    const where: Prisma.UserInterestConcertWhereInput = {
      userId,
      concert: {
        status: {
          in: ['ONGOING', 'UPCOMING'],
        },
      },
    };

    if (cursorDate && cursorId) {
      where.OR = [
        {
          concert: {
            startDate: {
              gt: cursorDate,
            },
          },
        },
        {
          AND: [
            {
              concert: {
                startDate: cursorDate,
              },
            },
            {
              concertId: {
                gt: cursorId,
              },
            },
          ],
        },
      ];
    }

    const items = await this.prismaService.userInterestConcert.findMany({
      where,
      include: {
        concert: {
          include: {
            schedules: {
              where: {
                type: { in: ['PRE_TICKETING', 'GENERAL_TICKETING'] },
              },
            },
          },
        },
      },
      orderBy: [
        { concert: { startDate: { sort: 'asc', nulls: 'last' } } },
        { concertId: 'asc' },
      ],
      ...(hasSize ? { take: size + 1 } : {}),
    });

    const hasNext = hasSize ? items.length > size : false;
    const pageItems = hasSize && hasNext ? items.slice(0, size) : items;

    const mappedItems = pageItems.map(
      (item) =>
        new InterestConcertResponseDto(
          item.concert,
          this.formatScheduleDate(item.concert.schedules, 'PRE_TICKETING'),
          this.formatScheduleDate(item.concert.schedules, 'GENERAL_TICKETING'),
          getDaysUntil(item.concert.startDate),
        ),
    );

    const lastItem = pageItems[pageItems.length - 1];

    return {
      data: mappedItems,
      cursor:
        hasSize && hasNext && lastItem
          ? {
              date: lastItem.concert.startDate,
              id: lastItem.concertId,
            }
          : null,
    };
  }

  private formatScheduleDate(
    schedules: Array<{ type: string; scheduledAt: Date }>,
    type: string,
  ): string | null {
    const schedule = schedules.find((item) => item.type === type);
    return schedule ? schedule.scheduledAt.toISOString() : null;
  }

  private async getInterestConcertsByTicketing(
    userId: number,
    cursorDate?: string,
    cursorId?: number,
    size?: number,
  ) {
    const hasSize = typeof size === 'number';

    let parsedCursorDate: Date | undefined;
    let cursorSortBucket: number | undefined;

    if (cursorDate) {
      parsedCursorDate = new Date(cursorDate);

      if (Number.isNaN(parsedCursorDate.getTime())) {
        throw new BadRequestException(ErrorCode.INVALID_CURSOR_FORMAT);
      }
    }

    if (parsedCursorDate !== undefined && cursorId !== undefined) {
      const cursorRows = await this.prismaService.$queryRaw<
        Array<{ sortBucket: number }>
      >(
        Prisma.sql`
      SELECT
        CASE
          WHEN MIN(s.scheduled_at) IS NOT NULL AND MIN(s.scheduled_at) >= NOW() THEN 0
          WHEN MIN(s.scheduled_at) IS NOT NULL
            AND MIN(s.scheduled_at) < NOW()
            AND STR_TO_DATE(REPLACE(REPLACE(c.start_date, '.', '-'), '/', '-'), '%Y-%m-%d') IS NOT NULL THEN 1
          ELSE 2
        END AS sortBucket
      FROM user_interest_concerts uic
      INNER JOIN concerts c ON c.id = uic.concert_id
      LEFT JOIN schedule s
        ON s.concert_id = c.id
       AND s.type IN ('PRE_TICKETING', 'GENERAL_TICKETING')
      WHERE uic.user_id = ${userId}
        AND c.status IN ('ONGOING', 'UPCOMING')
        AND c.id = ${cursorId}
      GROUP BY c.id, c.start_date
    `,
      );

      if (cursorRows.length === 0) {
        throw new BadRequestException(ErrorCode.INVALID_CURSOR_FORMAT);
      }

      cursorSortBucket = Number(cursorRows[0].sortBucket);
    }

    const cursorCondition =
      parsedCursorDate !== undefined &&
      cursorId !== undefined &&
      cursorSortBucket !== undefined
        ? Prisma.sql`
          HAVING
            sortBucket > ${cursorSortBucket}
            OR (
              sortBucket = ${cursorSortBucket}
              AND (
                (sortDate IS NOT NULL AND sortDate > ${parsedCursorDate})
                OR (
                  sortDate IS NOT NULL
                  AND sortDate = ${parsedCursorDate}
                  AND c.id < ${cursorId}
                )
                OR (
                  sortDate IS NULL
                  AND c.id < ${cursorId}
                )
              )
            )
        `
        : Prisma.empty;

    const rows = await this.prismaService.$queryRaw<
      Array<{
        concertId: number;
        sortDate: Date | null;
        preSaleDate: Date | null;
        generalSaleDate: Date | null;
      }>
    >(
      Prisma.sql`
    SELECT c.id AS concertId
      , CASE
          WHEN MIN(s.scheduled_at) IS NOT NULL AND MIN(s.scheduled_at) >= NOW() THEN 0
          WHEN MIN(s.scheduled_at) IS NOT NULL
            AND MIN(s.scheduled_at) < NOW()
            AND STR_TO_DATE(REPLACE(REPLACE(c.start_date, '.', '-'), '/', '-'), '%Y-%m-%d') IS NOT NULL THEN 1
          ELSE 2
        END AS sortBucket
      , CASE
          WHEN MIN(s.scheduled_at) IS NOT NULL AND MIN(s.scheduled_at) >= NOW() THEN MIN(s.scheduled_at)
          WHEN MIN(s.scheduled_at) IS NOT NULL
            AND MIN(s.scheduled_at) < NOW() THEN STR_TO_DATE(REPLACE(REPLACE(c.start_date, '.', '-'), '/', '-'), '%Y-%m-%d')
          ELSE STR_TO_DATE(REPLACE(REPLACE(c.start_date, '.', '-'), '/', '-'), '%Y-%m-%d')
        END AS sortDate
      , MIN(CASE WHEN s.type = 'PRE_TICKETING' THEN s.scheduled_at END) AS preSaleDate
      , MIN(CASE WHEN s.type = 'GENERAL_TICKETING' THEN s.scheduled_at END) AS generalSaleDate
    FROM user_interest_concerts uic
    INNER JOIN concerts c ON c.id = uic.concert_id
    LEFT JOIN schedule s 
      ON s.concert_id = c.id
     AND s.type IN ('PRE_TICKETING', 'GENERAL_TICKETING')
    WHERE uic.user_id = ${userId}
      AND c.status IN ('ONGOING', 'UPCOMING')
    GROUP BY c.id, c.start_date
    ${cursorCondition}
    ORDER BY 
      sortBucket ASC,
      sortDate IS NULL ASC,
      sortDate ASC,
      c.id ASC
    ${hasSize ? Prisma.sql`LIMIT ${size + 1}` : Prisma.empty}
  `,
    );

    const hasNext = hasSize ? rows.length > size : false;
    const pageRows = hasSize && hasNext ? rows.slice(0, size) : rows;

    const concertIds = pageRows.map((row) => Number(row.concertId));
    if (concertIds.length === 0) {
      return {
        data: [],
        cursor: null,
      };
    }

    const concerts = await this.prismaService.concert.findMany({
      where: {
        id: { in: concertIds },
        status: { in: ['ONGOING', 'UPCOMING'] },
      },
    });

    const concertMap = new Map(
      concerts.map((concert) => [concert.id, concert]),
    );

    const rowMap = new Map(pageRows.map((row) => [row.concertId, row]));

    const mappedItems = concertIds
      .map((concertId) => {
        const concert = concertMap.get(concertId);
        const row = rowMap.get(concertId);

        if (!concert || !row) return undefined;

        return new InterestConcertResponseDto(
          concert,
          row.preSaleDate ? row.preSaleDate.toISOString() : null,
          row.generalSaleDate ? row.generalSaleDate.toISOString() : null,
          getDaysUntil(concert.startDate),
        );
      })
      .filter((concert): concert is InterestConcertResponseDto => {
        return concert !== undefined;
      });

    const lastRow = pageRows[pageRows.length - 1];

    return {
      data: mappedItems,
      cursor:
        hasSize && hasNext && lastRow
          ? {
              date: lastRow.sortDate?.toISOString() ?? null,
              id: lastRow.concertId,
            }
          : null,
    };
  }

  // 관심 콘서트 삭제
  async removeInterestConcertById(userId: number, concertId: number) {
    await this.validateUser(userId);

    const concert = await this.prismaService.concert.findUnique({
      where: { id: concertId },
    });

    if (!concert) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    await this.prismaService.userInterestConcert.deleteMany({
      where: {
        userId,
        concertId,
      },
    });

    return;
  }

  // 유저 정보 조회
  async getUserInfo(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        userGenres: true,
      },
    });
    await this.validateUser(userId);
    return new UserResponseDto(user);
  }

  //닉네임 변경
  async updateNickname(userId, nickname) {
    await this.validateUser(userId);

    //닉네임 중복 확인
    const duplicate = await this.prismaService.user.findUnique({
      where: { nickname: nickname },
    });

    if (duplicate) {
      throw new BadRequestException(ErrorCode.NICKNAME_ALREADY_EXISTS);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { nickname: nickname },
    });

    return new UserResponseDto(updatedUser);
  }

  //닉네임 중복확인
  async checkNickname(nickname) {
    //닉네임 중복 확인
    const existingUser = await this.prismaService.user.findUnique({
      where: { nickname },
    });
    return { available: !existingUser };
  }

  //탈퇴한 유저 여부 확인
  async checkDeletedUser(providerId: string, provider: Provider) {
    const user = await this.prismaService.user.findUnique({
      where: { providerId, provider },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      const daysSinceDelete =
        (new Date().getTime() - user.deletedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceDelete < 7)
        throw new ForbiddenException(ErrorCode.WITHDRAWAL_PERIOD_NOT_PASSED);
    }
    return {
      message: '정상적인 유저입니다.',
      user: new UserResponseDto(user),
    };
  }

  //유저 취향 장르 조회
  async getUserGenrePreferences(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { userGenres: { include: { genre: true } } },
    });
    await this.validateUser(userId);

    return user.userGenres.map(
      (ug) => new UserGenreResponseDto(ug.genre, userId),
    );
  }

  //유저 취향 아티스트 조회
  async getUserArtistPreferences(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { userArtists: { include: { artist: true } } },
    });
    await this.validateUser(userId);

    return user.userArtists.map(
      (ua) => new UserArtistResponseDto(ua.artist, userId),
    );
  }

  //유저 취향 장르 설정
  async setUserGenrePreferences(userId: number, genreIds: number[]) {
    await this.validateUser(userId);

    // 장르 존재 여부 확인
    const genres = await this.prismaService.genre.findMany({
      where: { id: { in: genreIds } },
    });

    if (genres.length !== genreIds.length) {
      throw new NotFoundException(ErrorCode.GENRE_NOT_FOUND);
    }

    // 기존 취향 장르 삭제
    await this.prismaService.userGenre.deleteMany({
      where: { userId: userId },
    });

    // 새로운 취향 장르 생성
    const createData = genres.map((genre) => ({
      userId: userId,
      genreId: genre.id,
      genreName: genre.name,
    }));

    await this.prismaService.userGenre.createMany({
      data: createData,
    });

    return genres.map((genre) => new UserGenreResponseDto(genre, userId));
  }

  //유저 취향 아티스트 설정
  async setUserArtistPreferences(userId: number, artistIds: number[]) {
    await this.validateUser(userId);

    // 아티스트 존재 여부 확인
    const artists = await this.prismaService.representativeArtist.findMany({
      where: { id: { in: artistIds } },
    });

    if (artists.length !== artistIds.length) {
      throw new NotFoundException(ErrorCode.ARTIST_NOT_FOUND);
    }

    // 기존 취향 아티스트 삭제
    await this.prismaService.userArtist.deleteMany({
      where: { userId: userId },
    });

    // 새로운 취향 아티스트 생성
    const createData = artists.map((artist) => ({
      userId: userId,
      artistId: artist.id,
      artistName: artist.artistName,
    }));

    await this.prismaService.userArtist.createMany({
      data: createData,
    });

    return artists.map((artist) => new UserArtistResponseDto(artist, userId));
  }
}
