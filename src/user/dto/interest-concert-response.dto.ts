import { Concert } from '@prisma/client';

export class InterestConcertResponseDto {
  id: number;
  code: string | null;
  title: string | null;
  artist: string;
  startDate: string | null;
  endDate: string | null;
  poster: string | null;
  status: Concert['status'];
  daysLeft: number | null;
  ticketSite: string | null;
  ticketUrl: string | null;
  venue: string | null;
  introduction: string;
  label: string | null;
  preSaleDate: string | null;
  generalSaleDate: string | null;

  private static formatDate(date: string | null): string | null {
    return date ? date.replaceAll('-', '.') : null;
  }

  constructor(
    concert: Concert,
    preSaleDate: string | null,
    generalSaleDate: string | null,
    daysLeft?: number | null,
  ) {
    this.id = concert.id;
    this.code = concert.code;
    this.title = concert.title;
    this.startDate = InterestConcertResponseDto.formatDate(concert.startDate);
    this.endDate = InterestConcertResponseDto.formatDate(concert.endDate);
    this.status = concert.status;
    this.poster = concert.poster;
    this.artist = concert.artist;
    this.daysLeft = daysLeft;
    this.ticketSite = concert.ticketSite;
    this.ticketUrl = concert.ticketUrl;
    this.venue = concert.venue;
    this.introduction = concert.introduction;
    this.label = concert.label;
    this.preSaleDate = preSaleDate;
    this.generalSaleDate = generalSaleDate;
  }
}
