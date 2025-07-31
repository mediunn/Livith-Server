import { Controller, Get } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('카테고리')
@Controller('api/v2/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  //배너 조회
  @Get('/banners')
  @ApiOperation({
    summary: '배너 조회',
    description: '카테고리 배너를 조회합니다.',
  })
  getBanners() {
    return this.categoryService.getBanners();
  }
}
