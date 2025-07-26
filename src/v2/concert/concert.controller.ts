import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetConcertsDto } from './dto/get-concerts.dto';
import { ConcertService } from './concert.service';
import { ApiTags } from '@nestjs/swagger';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';

@ApiTags('콘서트')
@Controller('api/v2/concerts')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  // 콘서트 목록 조회
  @Get()
  getConcerts(@Query() query: GetConcertsDto) {
    return this.concertService.getConcerts(
      query.filter,
      query.cursor,
      query.size,
    );
  }

  // 콘서트 상세 조회
  @Get(':id')
  getConcertDetails(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertDetails(id);
  }

  // 콘서트의 아티스트 정보 조회
  @Get(':id/artist')
  getConcertArtist(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertArtist(id);
  }
}
