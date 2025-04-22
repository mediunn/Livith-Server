import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetSearchResultsDto } from './dto/get-search-results.dto';
import { ConcertResponseDto } from 'src/concert/dto/concert-response.dto';

@ApiTags('검색')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('/suggestions')
  @ApiOperation({
    summary: '추천 검색어 조회',
    description: '추천 검색어 10개를 조회합니다',
  })
  @ApiOkResponse({
    description: '추천 검색어 조회 성공',
    examples: {
      'application/json': {
        summary: '추천 검색어 예시',
        value: [
          'a',
          'ab',
          'abc',
          'abcd',
          'abcde',
          'ba',
          'bca',
          'cab',
          'dca',
          'eac',
        ],
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
    if (!letter?.trim()) {
      throw new BadRequestException('검색어(letter)는 필수입니다.');
    }
    return this.searchService.getRecommendWords(letter);
  }
  @Get()
  @ApiOperation({
    summary: '검색 결과 조회',
    description: '검색어에 대한 결과를 조회합니다',
  })
  @ApiOkResponse({
    description: '검색 결과 조회 성공',
    type: ConcertResponseDto,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청입니다.',
  })
  getSearchResults(@Query() query: GetSearchResultsDto) {
    if (!query.keyword?.trim()) {
      throw new BadRequestException('검색어(keyword)는 필수입니다.');
    }
    return this.searchService.getSearchResults(
      query.keyword,
      query.cursor,
      query.size,
    );
  }
}
