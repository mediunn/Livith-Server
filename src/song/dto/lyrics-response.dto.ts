import { Song } from '@prisma/client';

export class LyricsResponseDto {
  id: number;
  title: string;
  artist: string;
  lyrics: string[];
  pronunciation: string[];
  translation: string[];
  youtubeId: string;

  constructor(song: Song) {
    this.id = song.id;
    this.title = song.title;
    this.artist = song.artist;
    this.lyrics = song.lyrics
      ? song.lyrics
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      : [];

    this.pronunciation = song.pronunciation
      ? song.pronunciation
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      : [];
    this.translation = song.translation
      ? song.translation
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
      : [];
    this.youtubeId = song.youtubeId;
  }
}
