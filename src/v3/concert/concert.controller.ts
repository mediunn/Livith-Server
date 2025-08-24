import { Controller, Get, Query } from '@nestjs/common';
import { ConcertService } from './concert.service';
import { ApiOperation } from '@nestjs/swagger';
import { GetConcertsDto } from './dto/get-concerts.dto';

@Controller('api/v3/concerts')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  // 콘서트 목록 조회
  @Get()
  @ApiOperation({
    summary: '콘서트 목록 조회',
    description: '콘서트 목록을 조회합니다.',
  })
  getConcerts(@Query() query: GetConcertsDto) {
    return this.concertService.getConcerts(
      query.filter,
      query.cursor,
      query.size,
    );
  }
}
