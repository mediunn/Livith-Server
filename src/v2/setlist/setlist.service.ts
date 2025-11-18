import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SongResponseDto } from './dto/song-response.dto';
import { FanchantResponseDto } from './dto/fanchant-response.dto';

@Injectable()
export class SetlistService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSetlistSongs(id: number) {
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
      include: {
        song: true, // 곡 정보 포함
      },
      orderBy: { orderIndex: 'asc' },
    });

    return setlistSongs.map(
      (setlistSong) =>
        new SongResponseDto(setlistSong.song, setlistSong.orderIndex),
    );
  }

  // 곡 응원법 조회
  async getSongFanchant(setlistId: number, songId: number) {
    // 셋리스트 ID가 유효한지 확인
    const setlist = await this.prismaService.setlist.findUnique({
      where: { id: setlistId },
    });
    if (!setlist) {
      throw new NotFoundException('해당 셋리스트가 존재하지 않습니다.');
    }

    // 곡 ID가 유효한지 확인
    const song = await this.prismaService.song.findUnique({
      where: { id: songId },
    });
    if (!song) {
      throw new NotFoundException('해당 곡이 존재하지 않습니다.');
    }

    // 응원법 조회
    const fanchant = await this.prismaService.setlistSong.findFirst({
      where: {
        setlistId,
        songId,
      },
    });

    if (!fanchant) {
      throw new NotFoundException(
        '해당 셋리스트와 곡의 조합이 존재하지 않습니다.',
      );
    }

    return new FanchantResponseDto(fanchant);
  }
}
