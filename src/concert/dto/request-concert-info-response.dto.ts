import { ConcertRequest } from '@prisma/client';

export class RequestConcertInfoResponseDto {
  id: number;
  userId: number;
  autoRegister: boolean;
  title?: string;
  url?: string;
  requestContent?: string;

  constructor(concertRequest: ConcertRequest) {
    this.id = concertRequest.id;
    this.userId = concertRequest.userId;
    this.autoRegister = concertRequest.autoRegister;
    this.title = concertRequest.concertTitle;
    this.url = concertRequest.url;
    this.requestContent = concertRequest.requestContent;
  }
}
