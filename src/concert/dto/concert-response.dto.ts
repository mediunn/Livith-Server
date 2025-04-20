import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: '2025.04.19', description: '공연 시작일' })
  startDate: string;

  @ApiProperty({ example: '2025.04.20', description: '공연 종료일' })
  endDate: string;

  @ApiProperty({ example: 'ONGOING', description: '공연 상태' })
  status: string;

  @ApiProperty({ example: 0, description: '남은 날짜 (일 단위)' })
  daysLeft: number;

  @ApiProperty({
    example:
      'http://www.kopis.or.kr/upload/pfmPoster/PF_PF260496_250307_104419.jpg',
    description: '포스터 이미지 URL',
  })
  poster: string;

  @ApiProperty({ example: '모리이 아이미', description: '아티스트 이름' })
  artist: string;

  @ApiProperty({
    example: '2025-04-19T01:07:24.257Z',
    description: '데이터 생성일시 (ISO 8601)',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-04-18T16:21:50.974Z',
    description: '데이터 수정일시 (ISO 8601)',
  })
  updatedAt: Date;
}
