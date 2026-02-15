import { Banner } from '@prisma/client';

export class BannerResponseDto {
  id: number;
  title: string;
  category: string;
  imgUrl: string;
  content: string;
  constructor(banner: Banner) {
    this.id = banner.id;
    this.title = banner.title;
    this.category = banner.category;
    this.imgUrl = banner.imgUrl;
    this.content = banner.content;
  }
}
