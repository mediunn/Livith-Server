import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('탐색')
@Controller('api/v3/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  //배너 조회
  @Get('/banners')
  @ApiOperation({
    summary: '배너 조회',
    description: '카테고리 배너를 조회합니다.',
  })
  getBanners() {
    return this.searchService.getBanners();
  }
}
