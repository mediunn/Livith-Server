import { ApiProperty } from '@nestjs/swagger';
import { Song } from '@prisma/client';

export class SongResponseDto {
  @ApiProperty({ example: 1, description: '노래 ID' })
  id: number;
  @ApiProperty({ example: 1, description: '셋리스트 ID' })
  setlistId: number;
  @ApiProperty({
    example: 'https://example.com/song1.jpg',
    description: '노래 이미지 URL',
  })
  imgUrl: string;
  @ApiProperty({
    example: 'Everglow',
    description: '노래 제목',
  })
  title: string;
  @ApiProperty({
    example: 'Coldplay',
    description: '노래 아티스트',
  })
  artist: string;
  @ApiProperty({ example: 1, description: '셋리스트 내 노래 순서' })
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
