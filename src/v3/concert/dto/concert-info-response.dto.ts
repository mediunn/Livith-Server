import { ConcertInfo } from '@prisma/client';
export class ConcertInfoResponseDto {
  id: number;
  category: string;
  content: string;
  imgUrl: string;

  constructor(concertInfo: ConcertInfo) {
    this.id = concertInfo.id;
    this.category = concertInfo.category;
    this.content = concertInfo.content;
    this.imgUrl = concertInfo.imgUrl;
  }
}
