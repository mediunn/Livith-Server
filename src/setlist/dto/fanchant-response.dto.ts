import { SetlistSong } from '@prisma/client';

export class FanchantResponseDto {
  id: number;
  setlistId: number;
  songId: number;
  fanchant: string[];
  fanchantPoint: string;

  constructor(setlistSong: SetlistSong) {
    this.id = setlistSong.id;
    this.setlistId = setlistSong.setlistId;
    this.songId = setlistSong.songId;
    const rawFanchant = setlistSong.fanchant ?? '';
    this.fanchant = rawFanchant
      .split(/\r?\n/) // 줄바꿈 기준 분할
      .map((line) => line.trim()) // 앞뒤 공백 제거
      .filter(Boolean); // 빈 줄 제거
    this.fanchantPoint = setlistSong.fanchant_point;
  }
}
