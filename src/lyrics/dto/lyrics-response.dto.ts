import { ApiProperty } from '@nestjs/swagger';
import { Song } from '@prisma/client';

export class LyricsResponseDto {
  @ApiProperty({
    description: '노래 ID',
    example: 1,
  })
  id: number;
  @ApiProperty({
    description: '노래 제목',
    example: 'Cruel Summer',
  })
  title: string;
  @ApiProperty({
    description: '아티스트 이름',
    example: 'Tayler Swift',
  })
  artist: string;
  @ApiProperty({
    description: '가사 내용',
    example: ['Cruel summer', 'it’s cool summer'],
  })
  lyrics: string[];
  @ApiProperty({
    description: '발음 내용',
    example: ['크루얼 썸머', '잇스 쿨 썸머'],
  })
  pronunciation: string[];
  @ApiProperty({
    description: '번역 내용, 각 줄마다 배열로 구분',
    example: ['잔인한 여름', '시원한 여름'],
  })
  translation: string[];
  constructor(song: Song) {
    this.id = song.id;
    this.title = song.title;
    this.artist = song.artist;
    this.lyrics = song.lyrics ? song.lyrics.split(/\/n|\\n/) : [];
    this.pronunciation = song.pronunciation
      ? song.pronunciation.split(/\/n|\\n/)
      : [];
    this.translation = song.translation
      ? song.translation.split(/\/n|\\n/)
      : [];
  }
}
