import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SetInterestConcertDto } from './dto/set-interest-concert.dto';

@ApiTags('유저')
@Controller('api/v4/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //관심 콘서트 설정
  @Post('interest-concert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 설정',
    description: '유저의 관심 콘서트를 설정합니다.',
  })
  async setInterestConcert(@Body() dto: SetInterestConcertDto, @Req() req) {
    const userId = req.user.userId;
    return this.userService.setInterestConcert(dto.concertId, userId);
  }

  //관심 콘서트 조회
  @Get('interest-concert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 조회',
    description: '유저의 관심 콘서트를 조회합니다.',
  })
  async getInterestConcert(@Req() req) {
    const userId = req.user.userId;
    return this.userService.getInterestConcert(userId);
  }

  // 관심 콘서트 삭제
  @Delete('interest-concert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '유저의 관심 콘서트 삭제',
    description: '유저의 관심 콘서트를 삭제합니다.',
  })
  async removeInterestConcert(@Req() req) {
    const userId = req.user.userId;
    return this.userService.removeInterestConcert(userId);
  }

  // 유저 정보 조회
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
}
