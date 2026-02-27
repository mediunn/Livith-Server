import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SetlistService } from './setlist.service';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';

@ApiTags('셋리스트')
@Controller('api/v4/setlists/')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  //셋리스트 노래 목록 조회
  @Get(':id/songs')
  @ApiOperation({
    summary: '특정 셋리스트의 곡 목록 조회',
    description: '특정 셋리스트의 곡 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '셋리스트의 ID',
    type: Number,
    example: 1,
  })
  getSetlistSongs(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.setlistService.getSetlistSongs(id);
  }

  //노래 응원법 조회
  @Get(':setlistId/songs/:songId/fanchant')
  @ApiOperation({
    summary: '특정 셋리스트의 곡 응원법 조회',
    description: '특정 셋리스트의 곡에 대한 응원법을 조회합니다.',
  })
  @ApiParam({
    name: 'setlistId',
    description: '셋리스트의 ID',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'songId',
    description: '곡의 ID',
    type: Number,
    example: 1,
  })
  getSongFanchant(
    @Param('setlistId', ParsePositiveIntPipe) setlistId: number,
    @Param('songId', ParsePositiveIntPipe) songId: number,
  ) {
    return this.setlistService.getSongFanchant(setlistId, songId);
  }
}
