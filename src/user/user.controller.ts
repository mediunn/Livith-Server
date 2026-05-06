import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { API_PREFIX } from 'src/common/constants/api-prefix';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { ParsePositiveIntPipe } from 'src/common/pipes/parse-positive-int.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckDeletedUser } from './dto/check-deleted-user.dto';
import { GetInterestConcertsDto } from './dto/get-interest-concerts.dto';
import { SetInterestConcertsDto } from './dto/set-interest-concerts.dto';
import { SetUserArtistPreferencesDto } from './dto/set-user-artist-preferences.dto';
import { SetUserGenrePreferencesDto } from './dto/set-user-genre-preferences.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UserService } from './user.service';

@ApiTags('유저')
@Controller(`${API_PREFIX}/users`)
export class UserController {
  constructor(private readonly userService: UserService) {}

  //관심 콘서트 설정/수정
  @Put('interest-concerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 설정/수정',
    description: '유저의 관심 콘서트를 설정/수정합니다.',
  })
  async setInterestConcerts(@Req() req, @Body() dto: SetInterestConcertsDto) {
    const userId = req.user.userId;
    return this.userService.setInterestConcerts(dto.concertIds, userId);
  }

  //관심 콘서트 단건 추가
  @Post('interest-concert/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 단건 추가',
    description: '유저의 관심 콘서트에 특정 콘서트 1개를 추가합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '추가할 콘서트의 ID',
    type: Number,
    example: 1,
  })
  async addInterestConcertById(
    @Req() req,
    @Param('id', ParsePositiveIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.userService.addInterestConcertById(userId, id);
  }

  //관심 콘서트 조회
  @Get('interest-concerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 목록 조회',
    description: '유저의 관심 콘서트 목록을 조회합니다.',
  })
  async getInterestConcerts(
    @Req() req,
    @Query() query: GetInterestConcertsDto,
  ) {
    const userId = req.user.userId;
    return this.userService.getInterestConcerts(query, userId);
  }

  //유저의 관심 콘서트 여부 확인
  @Get('interest-concerts/:id/exists')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 여부 확인',
    description: '유저가 특정 콘서트를 관심 콘서트로 설정했는지 확인합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '콘서트의 ID',
    type: Number,
    example: 1,
  })
  async checkInterestConcert(
    @Req() req,
    @Param('id', ParsePositiveIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.userService.checkInterestConcert(userId, id);
  }

  // 유저의 관심 콘서트 단건 삭제
  @Delete('interest-concert/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 단건 삭제',
    description: '유저의 관심 콘서트에서 특정 콘서트 1개를 삭제합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '삭제할 콘서트의 ID',
    type: Number,
    example: 1,
  })
  async removeInterestConcertById(
    @Req() req,
    @Param('id', ParsePositiveIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.userService.removeInterestConcertById(userId, id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저 정보 조회',
    description: '현재 로그인한 유저의 정보를 조회합니다.',
  })
  async getUserInfo(@Req() req) {
    const userId = req.user.userId;
    return this.userService.getUserInfo(userId);
  }

  // 닉네임 수정
  @Patch('nickname')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '닉네임 수정',
    description: '현재 로그인한 유저의 닉네임을 수정합니다.',
  })
  async updateNickname(@Req() req, @Body() body: UpdateNicknameDto) {
    const userId = req.user.userId;
    const { nickname } = body;

    return this.userService.updateNickname(userId, nickname);
  }

  //닉네임 중복 확인
  @Get('check-nickname')
  @ApiOperation({
    summary: '닉네임 중복 확인',
    description: '닉네임을 중복 확인합니다.',
  })
  async checkNickname(@Query() query: UpdateNicknameDto) {
    return this.userService.checkNickname(query.nickname);
  }

  // 탈퇴한 유저 여부 확인
  @Get('check-deleted')
  @ApiOperation({
    summary: '탈퇴한 유저 여부 확인',
    description: '해당 유저가 탈퇴한 적이 있는지 확인합니다.',
  })
  async checkDeletedUser(@Query() query: CheckDeletedUser) {
    return this.userService.checkDeletedUser(query.providerId, query.provider);
  }

  // 유저 취향 장르 조회
  @Get('genre-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저 취향 장르 조회',
    description: '현재 로그인한 유저의 취향 장르를 조회합니다.',
  })
  async getUserGenrePreferences(@CurrentUser() user) {
    return this.userService.getUserGenrePreferences(user.userId);
  }

  // 유저 취향 아티스트 조회
  @Get('artist-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저 취향 아티스트 조회',
    description: '현재 로그인한 유저의 취향 아티스트를 조회합니다.',
  })
  async getUserArtistPreferences(@CurrentUser() user) {
    return this.userService.getUserArtistPreferences(user.userId);
  }

  //유저 취향 장르 설정
  @Put('genre-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저 취향 장르 설정/변경',
    description: '현재 로그인한 유저의 취향 장르를 설정/변경합니다.',
  })
  async setUserGenrePreferences(
    @CurrentUser() user,
    @Body() dto: SetUserGenrePreferencesDto,
  ) {
    return this.userService.setUserGenrePreferences(user.userId, dto.genreIds);
  }

  //유저 취향 아티스트 설정
  @Put('artist-preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저 취향 아티스트 설정/변경',
    description: '현재 로그인한 유저의 취향 아티스트를 설정/변경합니다.',
  })
  async setUserArtistPreferences(
    @CurrentUser() user,
    @Body() dto: SetUserArtistPreferencesDto,
  ) {
    return this.userService.setUserArtistPreferences(
      user.userId,
      dto.artistIds,
    );
  }
}
