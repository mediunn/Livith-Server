import { Genre } from '@prisma/client';

export class UserGenreResponseDto {
  id: number;
  userId: number;
  name: string;
  imgUrl: string;

  constructor(genre: Genre, userId: number) {
    this.id = genre.id;
    this.userId = userId;
    this.name = genre.name;
    this.imgUrl = genre.imgUrl;
  }
}
