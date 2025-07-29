import { ApiProperty } from '@nestjs/swagger';
import { Banner } from '@prisma/client';

export class BannerResponseDto {
  @ApiProperty({ example: 1, description: '배너 ID' })
  id: number;
  @ApiProperty({ example: '이벤트 배너', description: '배너 제목' })
  title: string;
  @ApiProperty({ example: '이벤트', description: '배너 카테고리' })
  category: string;
  @ApiProperty({
    example: 'https://example.com/banner1.jpg',
    description: '배너 이미지 URL',
  })
  imgUrl: string;
  constructor(banner: Banner) {
    this.id = banner.id;
    this.title = banner.title;
    this.category = banner.category;
    this.imgUrl = banner.imgUrl;
  }
}
