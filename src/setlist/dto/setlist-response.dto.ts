import { Setlist, SetlistType } from 'generated/prisma';

export class SetlistResponseDto {
  id: number;
  concertId: number;
  title: string;
  type: SetlistType;
  status: string;
  date: string;
  imgUrl: string;
  artist: string;

  constructor(setlist: Setlist) {
    this.id = setlist.id;
    this.concertId = setlist.concertId;
    this.title = setlist.title;
    this.type = setlist.type;
    this.status = setlist.status;
    this.date = setlist.date;
    this.imgUrl = setlist.imgUrl;
    this.artist = setlist.artist;
  }
}
