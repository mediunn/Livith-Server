import { Controller, Get, Query } from '@nestjs/common';
import { GetConcertsDto } from './dto/get-concerts.dto';
import { ConcertService } from './concert.service';
import { ApiTags } from '@nestjs/swagger';

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
}
