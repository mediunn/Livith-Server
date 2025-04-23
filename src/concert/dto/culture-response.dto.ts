import { ApiProperty } from '@nestjs/swagger';
import { Culture } from 'generated/prisma';

export class CultureResponseDto {
  @ApiProperty({ example: 1, description: '문화 ID' })
  id: number;
  @ApiProperty({ example: 1, description: '콘서트 ID' })
  concertId: number;
  @ApiProperty({
    example: '공연 중 촬영은 자제해주세요 📸',
    description: '문화 내용',
  })
  content: string;
  @ApiProperty({
    example: 'https://example.com/culture1.jpg',
    description: '문화 이미지 URL',
  })
  imgUrl: string;

  constructor(culture: Culture) {
    this.id = culture.id;
    this.concertId = culture.concertId;
    this.content = culture.content;
    this.imgUrl = culture.imgUrl;
  }
}
