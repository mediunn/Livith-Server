import { SetlistSong } from '@prisma/client';

export class FanchantResponseDto {
  id: number;
  setlistId: number;
  songId: number;
  fanchant: string[];

  constructor(setlistSong: SetlistSong) {
    this.id = setlistSong.id;
    this.setlistId = setlistSong.setlistId;
    this.songId = setlistSong.songId;
    this.fanchant = setlistSong.fanchant
      ? setlistSong.fanchant.split(/\r?\n/)
      : [];
  }
}
