import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HomeService } from './home.service';

@ApiTags('홈')
@Controller('api/v3/home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  // 홈 화면 섹션 정보 조회
  @Get()
  @ApiOperation({
    summary: '홈 화면 섹션 정보 조회',
    description: '홈 화면 섹션 정보를 조회합니다.',
  })
  async getHomeSections() {
    return this.homeService.getHomeSections();
  }
}
