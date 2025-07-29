import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('검색')
@Controller('api/v2/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

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
}
