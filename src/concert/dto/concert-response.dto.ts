import { ApiProperty } from '@nestjs/swagger';
import { Concert } from '@prisma/client';

export class ConcertResponseDto {
  @ApiProperty({ example: 1, description: '콘서트 ID' })
  id: number;
  @ApiProperty({ example: 'PF260496', description: '콘서트 코드' })
  code: string;

  @ApiProperty({
    example: '아이묭 투어: 돌핀 아파트먼트 [서울]',
    description: '콘서트 제목',
  })
  title: string;
  @ApiProperty({
    example: '아이묭',
    description: '콘서트 아티스트',
  })
  artist: string;
  @ApiProperty({ example: '2025.04.19', description: '공연 시작일' })
  startDate: string;
  @ApiProperty({ example: '2025.04.20', description: '공연 종료일' })
  endDate: string;
  @ApiProperty({
    example:
      'http://www.kopis.or.kr/upload/pfmPoster/PF_PF260496_250307_104419.jpg',
    description: '포스터 이미지 URL',
  })
  poster: string;
  @ApiProperty({ example: 'ONGOING', description: '공연 상태' })
  status: Concert['status'];
  @ApiProperty({
    example: 3,
    description: '공연 시작일까지 남은 일수',
  })
  daysLeft: number;

  @ApiProperty({
    example: 0,
    description: '정렬 인덱스',
  })
  sortedIndex: number;

  constructor(concert: Concert, daysLeft: number) {
    this.id = concert.id;
    this.code = concert.code;
    this.title = concert.title;
    this.artist = concert.artist;
    this.startDate = concert.startDate;
    this.endDate = concert.endDate;
    this.poster = concert.poster;
    this.status = concert.status;
    this.daysLeft = daysLeft;
    this.sortedIndex = concert.sortedIndex;
  }
}
