import { Concert } from '@prisma/client';

export class ConcertResponseDto {
  id: number;
  code: string;
  title: string;
  artist: string;
  startDate: string;
  endDate: string;
  poster: string;
  status: Concert['status'];
  daysLeft: number;
  ticketSite: string;
  ticketUrl: string;
  venue: string;
  introduction: string;
  label: string;

  private static formatDate(date: string | null): string | null {
    return date ? date.replaceAll('-', '.') : null;
  }

  constructor(concert: Concert, daysLeft?: number) {
    this.id = concert.id;
    this.code = concert.code;
    this.title = concert.title;
    this.startDate = ConcertResponseDto.formatDate(concert.startDate);
    this.endDate = ConcertResponseDto.formatDate(concert.endDate);
    this.status = concert.status;
    this.poster = concert.poster;
    this.artist = concert.artist;
    this.daysLeft = daysLeft;
    this.ticketSite = concert.ticketSite;
    this.ticketUrl = concert.ticketUrl;
    this.venue = concert.venue;
    this.introduction = concert.introduction;
    this.label = concert.label;
  }
}
