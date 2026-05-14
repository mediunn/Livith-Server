export class RepresentativeArtistDto {
  id: number;
  artistName: string;
  imgUrl: string;
  genreName: string;

  constructor(artist: any) {
    this.id = artist.id;
    this.artistName = artist.artistName;
    this.imgUrl = artist.imgUrl || artist.genre?.imgUrl;
    this.genreName = artist.genre?.name;
  }
}
