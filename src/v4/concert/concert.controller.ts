import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConcertService } from './concert.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetConcertsDto } from './dto/get-concerts.dto';
import { ParsePositiveIntPipe } from '../common/pipes/parse-positive-int.pipe';
import { GetCommentsDto } from './dto/get-comments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('콘서트')
@Controller('api/v4/concerts')
export class ConcertController {
  constructor(private readonly concertService: ConcertService) {}

  // 콘서트 목록 조회
  @Get()
  @ApiOperation({
    summary: '콘서트 목록 조회',
    description: '콘서트 목록을 조회합니다.',
  })
  getConcerts(@Query() query: GetConcertsDto) {
    return this.concertService.getConcerts(query.cursor, query.id, query.size);
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

  // 콘서트 일정 목록 조회
  @Get(':id/schedule')
  @ApiOperation({
    summary: '특정 콘서트 일정 목록 조회',
    description: '특정 콘서트에 해당하는 일정 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertSchedule(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertSchedule(id);
  }

  // 콘서트 셋리스트 목록 조회
  @Get(':id/setlists')
  @ApiOperation({
    summary: '특정 콘서트 셋리스트 목록 조회',
    description: '특정 콘서트에 해당하는 셋리스트 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertSetlists(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertSetlists(id);
  }

  // 콘서트의 대표 셋리스트 조회
  @Get(':id/main-setlist')
  @ApiOperation({
    summary: '특정 콘서트 대표 셋리스트 조회',
    description: '특정 콘서트에 해당하는 대표 셋리스트를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertMainSetlist(@Param('id', ParsePositiveIntPipe) id: number) {
    return this.concertService.getConcertMainSetlist(id);
  }

  // 콘서트의 셋리스트 상세 조회
  @Get(':concertId/setlists/:setlistId')
  @ApiOperation({
    summary: '특정 콘서트 셋리스트 상세 조회',
    description: '특정 콘서트의 셋리스트를 상세 조회합니다.',
  })
  @ApiParam({
    name: 'concertId',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: 'setlistId',
    description: '셋리스트의 ID',
    type: Number,
    example: 1,
  })
  getSetlistDetails(
    @Param('concertId', ParsePositiveIntPipe) concertId: number,
    @Param('setlistId', ParsePositiveIntPipe) setlistId: number,
  ) {
    return this.concertService.getSetlistDetails(setlistId, concertId);
  }

  // 콘서트 댓글 목록 조회
  @Get(':id/comments')
  @ApiOperation({
    summary: '특정 콘서트 댓글 목록 조회',
    description: '특정 콘서트에 해당하는 댓글 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  getConcertComments(
    @Param('id', ParsePositiveIntPipe) id: number,
    @Query() query: GetCommentsDto,
  ) {
    return this.concertService.getConcertComments(id, query.cursor, query.size);
  }

  // 콘서트 댓글 작성
  @Post(':id/comments')
  // 로그인한 사용자만 댓글 작성 가능
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '특정 콘서트 댓글 작성',
    description: '특정 콘서트에 해당하는 댓글을 작성합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  createConcertComment(
    @Param('id', ParsePositiveIntPipe) concertId: number,
    @Body() dto: CreateCommentDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.concertService.createConcertComment(
      concertId,
      userId,
      dto.content,
    );
  }
}
