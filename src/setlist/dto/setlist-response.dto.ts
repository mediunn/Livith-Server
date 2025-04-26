import { ApiProperty } from '@nestjs/swagger';
import { Setlist, SetlistType } from '@prisma/client';

export class SetlistResponseDto {
  @ApiProperty({ example: 1, description: '셋리스트 ID' })
  id: number;
  @ApiProperty({ example: 1, description: '콘서트 ID' })
  concertId: number;
  @ApiProperty({
    example: '2017 콜드플레이 월드투어',
    description: '셋리스트 제목',
  })
  title: string;
  @ApiProperty({
    example: 'ONGOING',
    description: '셋리스트 타입',
  })
  type: SetlistType;
  @ApiProperty({
    example: '1회차',
    description: '셋리스트 상태',
  })
  status: string;
  @ApiProperty({
    example: '2017-10-01',
    description: '셋리스트 날짜',
  })
  date: string;
  @ApiProperty({
    example: 'https://example.com/setlist1.jpg',
    description: '셋리스트 이미지 URL',
  })
  imgUrl: string;
  @ApiProperty({
    example: 'Coldplay',
    description: '셋리스트 아티스트',
  })
  artist: string;

  constructor(setlist: Setlist) {
    this.id = setlist.id;
    this.concertId = setlist.concertId;
    this.title = setlist.title;
    this.type = setlist.type;
    this.status = setlist.status;
    this.date = setlist.date;
    this.imgUrl = setlist.imgUrl;
    this.artist = setlist.artist;
  }
}
