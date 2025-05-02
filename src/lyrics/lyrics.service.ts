import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { LyricsResponseDto } from './dto/lyrics-response.dto';
import { FanchantResponseDto } from './dto/fanchant-response.dto';

@Injectable()
export class LyricsService {
  constructor(private readonly prisma: PrismaService) {}
  // 가사 및 기타 정보 조회
  async getLyrics(id: number) {
    // 곡 ID가 유효한지 확인
    const song = await this.prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      throw new NotFoundException('해당 곡이 존재하지 않습니다.');
    }

    // 노래 정보 조회
    const songs = await this.prisma.song.findUnique({
      where: { id: id },
    });

    return new LyricsResponseDto(songs);
  }

  // 응원법 조회
  async getFanchant(setlistId: number, songId: number) {
    // 셋리스트 ID가 유효한지 확인
    const setlist = await this.prisma.setlist.findUnique({
      where: { id: setlistId },
    });

    if (!setlist) {
      throw new NotFoundException('해당 셋리스트가 존재하지 않습니다.');
    }

    // 곡 ID가 유효한지 확인
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      throw new NotFoundException('해당 곡이 존재하지 않습니다.');
    }
    // 응원법 조회
    const fanchant = await this.prisma.setlistSong.findFirst({
      where: {
        setlistId: setlistId,
        songId: songId,
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
