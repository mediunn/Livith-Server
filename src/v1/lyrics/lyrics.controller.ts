import { Controller, Get, Param } from '@nestjs/common';
import { LyricsService } from './lyrics.service';
import { ParsePositiveIntPipe } from 'src/v1/common/pipes/parse-positive-int.pipe';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { LyricsResponseDto } from './dto/lyrics-response.dto';
import { FanchantResponseDto } from './dto/fanchant-response.dto';

@ApiTags('가사 정보')
@Controller()
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  //가사 및 기타 정보 조회
  @Get('/api/v1/songs/:id')
  @ApiOperation({
    summary: '가사 및 기타 정보 조회',
    description: '가사, 발음, 번역 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '가사 및 기타 정보 조회 성공',
    type: LyricsResponseDto,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  @ApiParam({
    name: 'id',
    description: '노래의 ID',
    type: 'number',
    example: 1,
  })
  getLyrics(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.lyricsService.getLyrics(id);
  }

  //응원법 조회
  @Get('/api/v1/setlists/:setlistId/songs/:songId/fanchant')
  @ApiOperation({
    summary: '응원법 조회',
    description: '응원법을 조회합니다.',
  })
  @ApiOkResponse({
    description: '응원법 조회 성공',
    type: FanchantResponseDto,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  @ApiParam({
    name: 'setlistId',
    description: '셋리스트의 ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'songId',
    description: '노래의 ID',
    type: 'number',
    example: 2,
  })
  getFanchant(
    @Param('setlistId', ParsePositiveIntPipe) setlistId: number,
    @Param('songId', ParsePositiveIntPipe) songId: number,
  ) {
    return this.lyricsService.getFanchant(setlistId, songId);
  }
}
