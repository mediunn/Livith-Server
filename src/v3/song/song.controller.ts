import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SongService } from './song.service';

@ApiTags('노래')
@Controller('api/v3/songs')
export class SongController {
  //특정 노래 가사 정보 조회
  constructor(private readonly songService: SongService) {}
  @Get(':id')
  @ApiOperation({
    summary: '특정 노래의 가사 정보 조회',
    description: '특정 노래의 가사, 발음, 번역 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '노래의 ID',
    type: Number,
    example: '1',
  })
  async getSongLyrics(@Param('id') id: number) {
    return this.songService.getSongLyrics(id);
  }
}
