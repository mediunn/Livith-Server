import { Controller, Get } from '@nestjs/common';
import { GenreService } from './genre.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('장르')
@Controller('api/v5/genres')
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
