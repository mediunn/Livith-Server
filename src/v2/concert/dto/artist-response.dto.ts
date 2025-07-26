import { Artist } from '@prisma/client';

export class ArtistResponseDto {
  id: number;
  artist: string;
  birthDate: string;
  birthPlace: string;
  category: string;
  detail: string;
  instagramUrl: string;
  keywords: string[];
  imgUrl: string;

  constructor(artist: Artist) {
    this.id = artist.id;
    this.artist = artist.artist;
    this.birthDate = artist.birthDate;
    this.birthPlace = artist.birthPlace;
    this.category = artist.category;
    this.detail = artist.detail;
    this.instagramUrl = artist.instagramUrl;
    this.keywords = artist.keywords.split(',').map((keyword) => keyword.trim());
    this.imgUrl = artist.imgUrl;
  }
}
