import { Genre } from '@prisma/client';

export class GenreResponseDto {
  id: number;
  name: string;
  imgUrl: string;

  constructor(genre: Genre) {
    this.id = genre.id;
    this.name = genre.name;
    this.imgUrl = genre.imgUrl;
  }
}
