import { Song } from '@prisma/client';

export class SongResponseDto {
  id: number;
  setlistId: number;
  imgUrl: string;
  title: string;
  artist: string;
  orderIndex: number;

  constructor(song: Song, setlistId: number, orderIndex: number) {
    this.id = song.id;
    this.title = song.title;
    this.artist = song.artist;
    this.setlistId = setlistId;
    this.orderIndex = orderIndex;
    this.imgUrl = song.imgUrl;
  }
}
