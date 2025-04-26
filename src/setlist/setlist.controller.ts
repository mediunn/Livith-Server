import { Controller, Get, Param, Query } from '@nestjs/common';
import { SetlistService } from './setlist.service';
import { ParsePositiveIntPipe } from 'src/common/pipes/parse-positive-int.pipe';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SetlistResponseDto } from './dto/setlist-response.dto';
import { GetSetlistsDto } from './dto/get-setlists.dto';

@ApiTags('셋리스트')
@Controller('')
export class SetlistController {
  constructor(private readonly setlistService: SetlistService) {}

  //셋리스트 목록 조회
  @Get('/concerts/:id/setlists')
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
  @Get('/setlists/:id')
  getSetlistDetails(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.setlistService.getSetlistDetails(id);
  }
}
