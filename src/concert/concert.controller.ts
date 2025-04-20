import { Controller, Get, Query } from '@nestjs/common';
import { ConcertService } from './concert.service';
import { GetConcertsDto } from './dto/get-concerts.dto';

@Controller('concerts')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Get()
  getConcerts(@Query() query: GetConcertsDto) {
    return this.concertService.getConcerts(
      query.status,
      query.cursor,
      query.size,
    );
  }
}
