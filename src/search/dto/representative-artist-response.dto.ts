import { RepresentativeArtist } from '@prisma/client';

export class RepresentativeArtistResponseDto {
  id: number;
  artistName: string;
  genreId: number;
  imgUrl?: string;
  constructor(artist: RepresentativeArtist) {
    this.id = artist.id;
    this.artistName = artist.artistName;
    this.genreId = artist.genreId;
    this.imgUrl = artist.imgUrl;
  }
}
