import { RepresentativeArtist } from '@prisma/client';

export class UserArtistResponseDto {
  id: number;
  userId: number;
  name: string;
  imgUrl: string;

  constructor(artist: RepresentativeArtist, userId: number) {
    this.id = artist.id;
    this.userId = userId;
    this.name = artist.artistName;
    this.imgUrl = artist.imgUrl;
  }
}
