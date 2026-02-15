import { Song } from '@prisma/client';

export class SongResponseDto {
  id: number;
  title: string;
  artist: string;
  orderIndex: number;

  constructor(song: Song, orderIndex: number) {
    this.id = song.id;
    this.title = song.title;
    this.artist = song.artist;
    this.orderIndex = orderIndex;
  }
}
