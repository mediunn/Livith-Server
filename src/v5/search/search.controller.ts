import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from '../common/constants/api-prefix';
import { ErrorCode } from '../common/enums/error-code.enum';
import { BadRequestException } from '../common/exceptions/business.exception';
import { GetArtistSearchResultsDto } from './dto/get-artist-search-results.dto';
import { GetConcertSearchResultsDto } from './dto/get-concert-search-results.dto';
import { SearchService } from './search.service';

@ApiTags('탐색')
@Controller(`${API_PREFIX}/search`)
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
      throw new BadRequestException(ErrorCode.SEARCH_KEYWORD_REQUIRED);
    }
    return this.searchService.getRecommendWords(letter);
  }

  // 탐색 화면 섹션 정보 조회
  @Get('/sections')
  @ApiOperation({
    summary: '탐색 화면 섹션 정보 조회',
    description: '탐색 화면 섹션 정보를 조회합니다.',
  })
  getSearchSections() {
    return this.searchService.getSearchSections();
  }

  //필터에 따른 검색 결과 콘서트 목록 조회
  @Get('/concerts')
  @ApiOperation({
    summary: '필터에 따른 검색 결과 콘서트 목록 조회',
    description: '필터에 따른 검색 결과 콘서트 목록을 조회합니다.',
  })
  getConcertSearchResults(@Query() query: GetConcertSearchResultsDto) {
    return this.searchService.getConcertSearchResults(query);
  }

  //대표 아티스트 검색 결과 목록 조회
  @Get('/artists')
  @ApiOperation({
    summary: '대표 아티스트 검색 결과 목록 조회',
    description: '대표 아티스트 검색 결과 목록을 조회합니다.',
  })
  async getSearchArtists(@Query() query: GetArtistSearchResultsDto) {
    return this.searchService.getArtistSearchResults(
      query.cursor,
      query.size,
      query.keyword,
    );
  }
}
