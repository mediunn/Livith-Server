import { Culture } from 'generated/prisma';

export class CultureResponseDto {
  id: number;
  concertId: number;
  content: string;
  imgUrl: string;

  constructor(culture: Culture) {
    this.id = culture.id;
    this.concertId = culture.concertId;
    this.content = culture.content;
    this.imgUrl = culture.imgUrl;
  }
}
