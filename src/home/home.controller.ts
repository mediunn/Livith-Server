import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}
  // 배너 조회
  @Get('/banners')
  getBanners() {
    return this.homeService.getBanners();
  }
}
