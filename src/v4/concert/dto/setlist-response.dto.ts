import { Setlist, SetlistType } from '@prisma/client';

export class SetlistResponseDto {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  imgUrl: string;
  status: string;
  type: SetlistType;
  venue: string;
  artist: string;

  constructor(setlist: Setlist, status: string | null = null, type: string) {
    this.id = setlist.id;
    this.title = setlist.title;
    this.imgUrl = setlist.imgUrl;
    this.type = type as SetlistType;
    this.title = setlist.title;
    this.startDate = setlist.startDate;
    this.endDate = setlist.endDate;
    this.status = status;
    this.venue = setlist.venue;
    this.artist = setlist.artist;
  }
}
