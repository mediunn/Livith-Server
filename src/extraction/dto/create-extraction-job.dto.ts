import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const INSTAGRAM_POST_URL =
  /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?.*$/;

export class CreateExtractionJobDto {
  @ApiProperty({
    description: '인스타그램 게시글 URL',
    example: 'https://www.instagram.com/p/DAbc123xyz',
  })
  @Matches(INSTAGRAM_POST_URL, {
    message: '유효한 인스타그램 게시글 URL이 아닙니다.',
  })
  instagramUrl: string;
}
