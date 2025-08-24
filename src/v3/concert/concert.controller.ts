import { Controller, Get, Param, Query } from '@nestjs/common';
import { ConcertService } from './concert.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { GetConcertsDto } from './dto/get-concerts.dto';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';

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

  // 콘서트 상세 조회
  @Get(':id')
  @ApiOperation({
    summary: '특정 콘서트 상세 조회',
    description: '특정 콘서트를 상세 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertDetails(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertDetails(id);
  }

  // 콘서트의 아티스트 정보 조회
  @Get(':id/artist')
  @ApiOperation({
    summary: '특정 콘서트 아티스트 조회',
    description: '특정 콘서트에 해당하는 아티스트 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertArtist(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertArtist(id);
  }

  // 콘서트에 해당하는 문화 목록 조회
  @Get(':id/cultures')
  @ApiOperation({
    summary: '특정 콘서트 문화 목록 조회',
    description: '특정 콘서트에 해당하는 문화 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertCulture(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertCulture(id);
  }

  // 콘서트에 해당하는 MD 목록 조회
  @Get(':id/mds')
  @ApiOperation({
    summary: '특정 콘서트 MD 목록 조회',
    description: '특정 콘서트에 해당하는 MD 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertMds(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertMds(id);
  }

  // 콘서트 필수 정보 목록 조회
  @Get(':id/info')
  @ApiOperation({
    summary: '특정 콘서트 필수 정보 목록 조회',
    description: '특정 콘서트에 해당하는 필수 정보 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertInfo(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertInfos(id);
  }
}
