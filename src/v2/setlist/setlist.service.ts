import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { SongResponseDto } from './dto/song-response.dto';

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
}
