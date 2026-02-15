import { RepresentativeArtist } from '@prisma/client';

export class UserArtistResponseDto {
  id: number;
  userId: number;
  genreId: number;
  name: string;
  imgUrl: string;

  constructor(artist: RepresentativeArtist, userId: number) {
    this.id = artist.id;
    this.userId = userId;
    this.genreId = artist.genreId;
    this.name = artist.artistName;
    this.imgUrl = artist.imgUrl;
  }
}
