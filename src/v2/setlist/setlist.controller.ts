import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';
import { SetlistService } from './setlist.service';

@ApiTags('셋리스트')
@Controller('api/v2/setlist/')
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
}
