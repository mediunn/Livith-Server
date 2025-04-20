import { Controller, Get, Query } from '@nestjs/common';
import { ConcertService } from './concert.service';
import { GetConcertsDto } from './dto/get-concerts.dto';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ConcertResponseDto } from './dto/concert-response.dto';

@ApiTags('콘서트')
@Controller('concerts')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  @Get()
  @ApiOperation({
    summary: '콘서트 목록 조회',
    description: '콘서트 목록을 조회합니다.',
  })
  @ApiOkResponse({
    description: '콘서트 목록 조회 성공',
    type: [ConcertResponseDto],
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  getConcerts(@Query() query: GetConcertsDto) {
    return this.concertService.getConcerts(
      query.status,
      query.cursor,
      query.size,
    );
  }
}
