import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertResponseDto } from './dto/concert-response.dto';
import { getDaysUntil } from '../common/utils/date.util';
import { ArtistResponseDto } from './dto/artist-response.dto';
import { CultureResponseDto } from './dto/culture-response.dto';
import { MDResponseDto } from './dto/md-response.dto';
import { ConcertInfoResponseDto } from './dto/concert-info-response.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { SetlistResponseDto } from './dto/setlist-response.dto';
import { CommentResponseDto } from '../comment/dto/comment-response.dto';

@Injectable()
export class ConcertService {
  constructor(private readonly prismaService: PrismaService) {}
  // 콘서트 목록 조회
  async getConcerts(cursor?: string, id?: number, size?: number) {
    const cursorValue =
      cursor && id ? { startDate: cursor, id: Number(id) } : undefined;

    const concerts = await this.prismaService.concert.findMany({
      orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
      cursor: cursorValue,
      take: size,
      skip: cursor ? 1 : 0,
    });

    const concertResponse = concerts.map(
      (concert) =>
        new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
    );

    const nextCursor =
      concerts.length > 0
        ? {
            startDate: concerts[concerts.length - 1].startDate,
            id: concerts[concerts.length - 1].id,
          }
        : null;

    return {
      data: concertResponse,
      cursor: nextCursor,
    };
  }

  // 콘서트 상세 조회
  async getConcertDetails(id: number) {
    const concert = await this.prismaService.concert.findUnique({
      where: {
        id: id,
      },
    });

    // 콘서트가 없을 경우 예외 처리
    if (!concert) {
      throw new NotFoundException(`해당 콘서트를 찾을 수 없습니다.`);
    }

    return new ConcertResponseDto(concert, getDaysUntil(concert.startDate));
  }

  // 콘서트의 아티스트 정보 조회
  async getConcertArtist(id: number) {
    const artistId = await this.prismaService.concert.findUnique({
      where: {
        id: id,
      },
      select: {
        artistId: true,
      },
    });

    // 콘서트가 없을 경우 예외 처리
    if (!artistId) {
      throw new NotFoundException(`해당 콘서트를 찾을 수 없습니다.`);
    }

    // 아티스트 정보 조회
    const artist = await this.prismaService.artist.findUnique({
      where: {
        id: artistId.artistId,
      },
    });

    // 아티스트가 없을 경우 예외 처리
    if (!artist) {
      throw new NotFoundException(`해당 아티스트를 찾을 수 없습니다.`);
    }

    return new ArtistResponseDto(artist);
  }

  // 콘서트에 해당하는 문화 조회
  async getConcertCulture(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    // 문화 조회
    const cultures = await this.prismaService.culture.findMany({
      where: {
        concertId: id,
      },
    });

    return cultures.map((culture) => new CultureResponseDto(culture));
  }

  // 콘서트에 해당하는 MD 목록 조회
  async getConcertMds(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    // MD 조회
    const mds = await this.prismaService.md.findMany({
      where: {
        concertId: id,
      },
    });

    return mds.map((md) => new MDResponseDto(md));
  }

  // 콘서트의 필수 정보 목록 조회
  async getConcertInfos(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    const concertInfos = await this.prismaService.concertInfo.findMany({
      where: {
        concertId: id,
      },
    });

    return concertInfos.map((info) => new ConcertInfoResponseDto(info));
  }

  // 콘서트 일정 목록 조회
  async getConcertSchedule(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    const schedules = await this.prismaService.schedule.findMany({
      where: {
        concertId: id,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return schedules.map((schedule) => new ScheduleResponseDto(schedule));
  }

  // 콘서트 셋리스트 목록 조회
  async getConcertSetlists(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }
    // ConcertSetlist 기준으로 연결된 Setlist 가져오기
    const concertSetlists = await this.prismaService.concertSetlist.findMany({
      where: {
        concertId: id,
      },
      include: {
        setlist: true,
      },
      orderBy: {
        setlist: {
          startDate: 'desc', // 셋리스트 시작일 기준 내림차순 정렬
        },
      },
    });

    // 셋리스트 타입별로 분류
    const expectedItems = concertSetlists.filter(
      (item) => item.type === 'EXPECTED',
    );
    const otherItems = concertSetlists.filter(
      (item) => item.type !== 'EXPECTED',
    );

    // EXPECTED 타입의 셋리스트를 맨 앞으로 정렬
    const sortedSetlists = [...expectedItems, ...otherItems];

    // status 가공
    const transformed = sortedSetlists.map((item, idx) => {
      let status = null;

      if (item.type === 'EXPECTED') {
        status = '예상';
      } else if (
        idx === expectedItems.length &&
        (item.type === 'ONGOING' || item.type === 'PAST')
      ) {
        // expectedItems 길이만큼 건너뛴 후 첫 번째 비예상 항목에 '최근' status 부여
        status = '최근';
      }

      return {
        ...item,
        status,
      };
    });

    return transformed.map(
      (setlist) =>
        new SetlistResponseDto(setlist.setlist, setlist.status, setlist.type),
    );
  }

  // 콘서트의 대표 셋리스트 조회
  async getConcertMainSetlist(id: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    const concertSetlist = await this.prismaService.concertSetlist.findMany({
      where: {
        concertId: id,
      },
      include: {
        setlist: true,
      },
      orderBy: {
        setlist: {
          startDate: 'desc', // 셋리스트 시작일 기준 내림차순
        },
      },
    });

    // 콘서트셋리스트가 없을 경우 예외 처리
    if (concertSetlist.length === 0) {
      return null;
    }
    //예상 셋리스트가 있는 경우
    const expected = concertSetlist.find((item) => item.type === 'EXPECTED');

    if (expected) {
      return new SetlistResponseDto(expected.setlist, '대표', expected.type);
    }
    // 예상 셋리스트가 없는 경우, 가장 최근의 셋리스트를 대표로 설정
    const recentSetlist = concertSetlist[0];

    return new SetlistResponseDto(
      recentSetlist.setlist,
      '대표',
      recentSetlist.type,
    );
  }

  // 콘서트의 셋리스트 상세 조회
  async getSetlistDetails(setlistId: number, concertId: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id: concertId },
    });

    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    // 셋리스트 ID가 유효한지 확인
    const setlist = await this.prismaService.setlist.findUnique({
      where: { id: setlistId },
    });
    if (!setlist) {
      throw new NotFoundException('해당 셋리스트가 존재하지 않습니다.');
    }

    // 콘서트 ID와 셋리스트 ID가 일치하는 콘서트셋리스트 확인
    const concertSetlist = await this.prismaService.concertSetlist.findFirst({
      where: {
        setlistId: setlistId,
        concertId: concertId,
      },
    });

    // 콘서트셋리스트가 없을 경우 예외 처리
    if (!concertSetlist) {
      throw new NotFoundException(
        '해당 셋리스트와 콘서트의 조합이 존재하지 않습니다.',
      );
    }
    // 해당 콘서트의 모든 셋리스트 중 가장 startDate가 최신인 것 찾기
    const latestSetlist = await this.prismaService.concertSetlist.findFirst({
      where: {
        concertId,
      },
      orderBy: {
        setlist: {
          startDate: 'desc',
        },
      },
      include: {
        setlist: true,
      },
    });

    // status 가공
    let status: string | null = null;

    if (concertSetlist.type === 'EXPECTED') {
      status = '예상';
    } else if (setlist.id === latestSetlist?.setlist?.id) {
      status = '최근';
    }

    return new SetlistResponseDto(setlist, status, concertSetlist.type);
  }

  // 콘서트 댓글 목록 조회
  async getConcertComments(id: number, cursor?: string, size?: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id },
    });
    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    //댓글 전체 개수
    const totalCount = await this.prismaService.concertComment.count({
      where: { concertId: id },
    });

    let cursorValue;
    if (cursor) {
      try {
        const parsed = JSON.parse(cursor);
        cursorValue = {
          createdAt: new Date(parsed.createdAt),
          id: parsed.id,
        };
      } catch (e) {
        throw new BadRequestException('유효하지 않은 cursor 형식입니다.');
      }
    }

    const comments = await this.prismaService.concertComment.findMany({
      where: { concertId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], //최신 댓글이 위로 오도록 정렬
      cursor: cursorValue,
      take: size,
      skip: cursor ? 1 : 0,
    });

    const concertResponse = comments.map(
      (comment) => new CommentResponseDto(comment),
    );

    const nextCursor =
      comments.length > 0
        ? {
            createdAt: comments[comments.length - 1].createdAt,
            id: comments[comments.length - 1].id,
          }
        : null;

    return {
      data: concertResponse,
      cursor: nextCursor,
      totalCount,
    };
  }

  // 콘서트 댓글 작성
  async createConcertComment(
    concertId: number,
    userId: number,
    content: string,
  ) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id: concertId },
    });
    if (!concert) {
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }
    // 댓글 작성
    const newComment = await this.prismaService.concertComment.create({
      data: {
        concertId,
        userId,
        content,
      },
    });

    return new CommentResponseDto(newComment);
  }
}
