import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BannerResponseDto } from './dto/banner-response.dto';

@ApiTags('홈')
@Controller('api/v1/home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}
  // 배너 조회
  @Get('/banners')
  @ApiOperation({
    summary: '배너 조회',
    description: '홈 화면에 표시할 배너를 조회합니다.',
  })
  @ApiOkResponse({
    description: '배너 조회 성공',
    type: [BannerResponseDto],
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  getBanners() {
    return this.homeService.getBanners();
  }
}
