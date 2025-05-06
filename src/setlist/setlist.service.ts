import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SetlistResponseDto } from './dto/setlist-response.dto';
import { SetlistType } from '@prisma/client';
import { SongResponseDto } from './dto/song-response.dto';

@Injectable()
export class SetlistService {
  constructor(private readonly prismaService: PrismaService) {}
  // 콘서트 ID에 해당하는 셋리스트 목록 조회
  async getSetlists(
    id: number,
    size: number,
    cursor: string,
    type: SetlistType,
  ) {
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
        type: type,
        ...(cursor && { setlist: { date: { lt: cursor } } }), // cursor 조건
      },
      include: {
        setlist: true, // 연결된 셋리스트 내용 가져오기
      },
      orderBy: {
        setlist: {
          date: 'desc',
        },
      },
      take: size,
    });

    // Setlist만 추출해서 DTO로 매핑
    const concertSetlistResponse = concertSetlists.map(
      (cs) => new SetlistResponseDto(cs.setlist, cs),
    );

    const nextCursor =
      concertSetlists.length > 0
        ? concertSetlists[concertSetlists.length - 1].setlist.date
        : null;

    return {
      data: concertSetlistResponse,
      cursor: nextCursor,
    };
  }

  // 특정 셋리스트 조회
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
        setlistId: setlistId, // 셋리스트 id와 일치하는 콘서트셋리스트를 필터링
        concertId: concertId, // 콘서트 id와 일치하는 콘서트셋리스트를 필터링
      },
    });

    // 콘서트셋리스트가 없을 경우 예외 처리
    if (!concertSetlist) {
      throw new NotFoundException(
        '해당 셋리스트와 콘서트의 조합이 존재하지 않습니다.',
      );
    }
    return new SetlistResponseDto(setlist, concertSetlist);
  }

  // 특정 셋리스트에 해당하는 곡 목록 조회
  async getSetlistSongs(id: number, size: number, cursor: number) {
    // 셋리스트 ID가 유효한지 확인
    const setlist = await this.prismaService.setlist.findUnique({
      where: { id },
    });
    if (!setlist) {
      throw new NotFoundException('해당 셋리스트가 존재하지 않습니다.');
    }

    // 셋리스트에 해당하는 곡 목록 조회
    const setlistSongs = await this.prismaService.setlistSong.findMany({
      where: { setlistId: id },
      orderBy: { orderIndex: 'asc' },
      cursor: cursor
        ? { setlistId_orderIndex: { setlistId: id, orderIndex: cursor } }
        : undefined,
      take: size,
      skip: cursor ? 1 : 0, // cursor가 있을 때만 건너뛰기
    });

    //곡 ID 목록 생성
    const songIds = setlistSongs.map((setlistSong) => setlistSong.songId);

    // 곡 정보 한번에 조회
    const songDetails = await this.prismaService.song.findMany({
      where: { id: { in: songIds } },
    });

    // songId를 기준으로 빠르게 찾기
    const songDetailMap = new Map(songDetails.map((song) => [song.id, song]));

    // 매칭해서 DTO 만들기
    return setlistSongs.map((setlistSong) => {
      const songDetail = songDetailMap.get(setlistSong.songId);

      return new SongResponseDto(
        songDetail,
        setlistSong.setlistId,
        setlistSong.orderIndex,
      );
    });
  }
}
