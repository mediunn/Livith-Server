import { Controller, Get } from '@nestjs/common';
import { GenreService } from './genre.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from '../common/constants/api-prefix';

@ApiTags('장르')
@Controller(`${API_PREFIX}/genres`)
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  // 장르 목록 조회
  @ApiOperation({
    summary: '장르 목록 조회',
    description: '장르 목록을 조회합니다.',
  })
  @Get()
  async getGenres() {
    return this.genreService.getGenres();
  }
}
