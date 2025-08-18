import { Artist } from '@prisma/client';

export class ArtistResponseDto {
  id: number;
  artist: string;
  debutDate: string;
  debutPlace: string;
  category: string;
  detail: string;
  instagramUrl: string;
  keywords: string[];
  imgUrl: string;

  constructor(artist: Artist) {
    this.id = artist.id;
    this.artist = artist.artist;
    this.debutDate = artist.debutDate;
    this.debutPlace = artist.debutPlace;
    this.category = artist.category;
    this.detail = artist.detail;
    this.instagramUrl = artist.instagramUrl;
    this.keywords = artist.keywords.split(',').map((keyword) => keyword.trim());
    this.imgUrl = artist.imgUrl;
  }
}
