import { Culture } from '@prisma/client';

export class CultureResponseDto {
  id: number;
  concertId: number;
  title: string;
  content: string;

  constructor(culture: Culture) {
    this.id = culture.id;
    this.concertId = culture.concertId;
    this.content = culture.content;
    this.title = culture.title;
  }
}
