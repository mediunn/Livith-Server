import { RepresentativeArtist } from '@prisma/client';

export class RepresentativeArtistResponseDto {
  id: number;
  name: string;
  genreId: number;
  imgUrl: string;
  constructor(artist: RepresentativeArtist) {
    this.id = artist.id;
    this.name = artist.artistName;
    this.genreId = artist.genreId;
    this.imgUrl = artist.imgUrl;
  }
}
