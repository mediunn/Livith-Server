import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('/suggestions')
  getRecommendWords(@Query('letter') letter: string) {
    return this.searchService.getRecommendWords(letter);
  }
}
