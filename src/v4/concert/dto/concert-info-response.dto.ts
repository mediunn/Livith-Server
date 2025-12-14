import { Info } from '@prisma/client';

export class InfoResponseDto {
  id: number;
  category: string;
  content: string;
  imgUrl: string;

  constructor(info: Info) {
    this.id = info.id;
    this.category = info.category;
    this.content = info.content;
    this.imgUrl = info.imgUrl;
  }
}
