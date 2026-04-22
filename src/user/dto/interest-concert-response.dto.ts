import { Concert } from '@prisma/client';

export class InterestConcertResponseDto {
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
  preSaleDate: string;
  generalSaleDate: string;

  private static formatDate(date: string): string {
    return date ? date.replaceAll('-', '.') : null;
  }

  constructor(
    concert: Concert,
    preSaleDate: string,
    generalSaleDate: string,
    daysLeft?: number,
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
