import { Setlist, SetlistType } from '@prisma/client';

export class SetlistResponseDto {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  imgUrl: string;
  status: string;
  type: SetlistType;

  constructor(setlist: Setlist, status: string | null = null, type: string) {
    this.id = setlist.id;
    this.title = setlist.title;
    this.imgUrl = setlist.imgUrl;
    this.type = type as SetlistType; // 타입을 SetlistType으로 변환
    this.title = setlist.title;
    this.startDate = setlist.startDate;
    this.endDate = setlist.endDate;
    this.status = status;
  }
}
