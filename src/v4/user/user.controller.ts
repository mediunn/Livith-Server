import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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
}
