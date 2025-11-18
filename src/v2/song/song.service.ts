import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { LyricsResponseDto } from './dto/lyrics-response.dto';

@Injectable()
export class SongService {
  constructor(private readonly prisma: PrismaService) {}
  // 특정 노래의 가사 정보 조회
  async getSongLyrics(id: number) {
    // 곡 ID가 유효한지 확인
    const song = await this.prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      throw new NotFoundException('해당 곡이 존재하지 않습니다.');
    }

    return new LyricsResponseDto(song);
  }
}
