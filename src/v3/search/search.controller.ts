import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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

  //추천 검색어 조회
  @Get('/suggestions')
  @ApiOperation({
    summary: '추천 검색어 조회',
    description: '추천 검색어 10개를 조회합니다',
  })
  @ApiQuery({
    name: 'letter',
    description: '검색할 글자',
    type: String,
    example: 'a',
  })
  getRecommendWords(@Query('letter') letter: string) {
    if (!letter?.trim()) {
      throw new BadRequestException('검색어(letter)는 필수입니다.');
    }
    return this.searchService.getRecommendWords(letter);
  }

  // 탐색 화면 섹션 정보 조회
  @Get('/sections')
  @ApiOperation({
    summary: '탐색 화면 섹션 정보 조회',
    description: '탐색 화면 섹션 정보를 조회합니다.',
  })
  async getSearchSections() {
    return this.searchService.getSearchSections();
  }
}
