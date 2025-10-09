import { Md } from '@prisma/client';

export class MDResponseDto {
  id: number;
  name: string;
  price: string;
  imgUrl: string;

  constructor(md: Md) {
    this.id = md.id;
    this.name = md.name;
    this.price = md.price;
    this.imgUrl = md.imgUrl;
  }
}
