import { Controller, Get, Param, Query } from '@nestjs/common';
import { SetlistService } from './setlist.service';
import { ParsePositiveIntPipe } from 'src/v1/common/pipes/parse-positive-int.pipe';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SetlistResponseDto } from './dto/setlist-response.dto';
import { GetSetlistsDto } from './dto/get-setlists.dto';
import { GetSetlistSongsDto } from './dto/get-setlist-songs.dto';
import { SongResponseDto } from './dto/song-response.dto';

@ApiTags('셋리스트')
@Controller('')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  //셋리스트 목록 조회
  @Get('api/v1/concerts/:id/setlists')
  @ApiOperation({
    summary: '특정 콘서트의 셋리스트 목록 조회',
    description: '특정 콘서트의 셋리스트 목록을 조회합니다.',
  })
  @ApiOkResponse({
    description: '특정 콘서트의 셋리스트 목록 조회 성공',
    type: [SetlistResponseDto],
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getSetlists(
    @Query() query: GetSetlistsDto,
    @Param('id', ParsePositiveIntPipe) id: number,
  ) {
    return this.setlistService.getSetlists(
      id,
      query.size,
      query.cursor,
      query.type,
    );
  }

  //특정 셋리스트 조회
  @Get('api/v1/concerts/:concertId/setlists/:setlistId')
  @ApiOperation({
    summary: '특정 셋리스트 조회',
    description: '특정 셋리스트를 조회합니다.',
  })
  @ApiOkResponse({
    description: '특정 셋리스트 조회 성공',
    type: SetlistResponseDto,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  @ApiParam({
    name: 'setlistId',
    description: '셋리스트의 ID',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'concertId',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getSetlistDetails(
    @Param('setlistId', ParsePositiveIntPipe) setlistId: number,
    @Param('concertId', ParsePositiveIntPipe) concertId: number,
  ) {
    return this.setlistService.getSetlistDetails(setlistId, concertId);
  }

  //셋리스트 노래 목록 조회
  @Get('api/v1/setlists/:id/songs')
  @ApiOperation({
    summary: '특정 셋리스트의 곡 목록 조회',
    description: '특정 셋리스트의 곡 목록을 조회합니다.',
  })
  @ApiOkResponse({
    description: '특정 셋리스트의 곡 목록 조회 성공',
    type: [SongResponseDto],
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  @ApiParam({
    name: 'id',
    description: '셋리스트의 ID',
    type: Number,
    example: 1,
  })
  getSetlistSongs(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Query() query: GetSetlistSongsDto,
  ) {
    return this.setlistService.getSetlistSongs(id, query.size, query.cursor);
  }
}
