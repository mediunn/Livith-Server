export class LyricsResponseDto {
  id: number;
  title: string;
  artist: string;
  lyrics: string[];
  pronunciation: string[];
  translation: string[];
  constructor(song: any) {
    this.id = song.id;
    this.title = song.title;
    this.artist = song.artist;
    this.lyrics = song.lyrics ? song.lyrics.split('\n') : [];
    this.pronunciation = song.pronunciation
      ? song.pronunciation.split('\n')
      : [];
    this.translation = song.translation ? song.translation.split('\n') : [];
  }
}
