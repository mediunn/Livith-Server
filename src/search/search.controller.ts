import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetSearchResultsDto } from './dto/get-search-results.dto';

@ApiTags('검색')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('/suggestions')
  @ApiOperation({
    summary: '추천 검색어 조회',
    description: '추천 검색어 5개를 조회합니다',
  })
  @ApiOkResponse({
    description: '추천 검색어 조회 성공',
    examples: {
      'application/json': {
        summary: '추천 검색어 예시',
        value: ['a', 'ab', 'abc', 'abcd', 'abcde'],
      },
    },
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  @ApiQuery({
    name: 'letter',
    description: '검색할 글자',
    type: String,
    example: 'a',
  })
  getRecommendWords(@Query('letter') letter: string) {
    return this.searchService.getRecommendWords(letter);
  }
  @Get()
  getSearchResults(@Query() query: GetSearchResultsDto) {
    return this.searchService.getSearchResults(
      query.keyword,
      query.cursor,
      query.size,
    );
  }
}
