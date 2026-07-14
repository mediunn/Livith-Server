import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { API_PREFIX } from '../common/constants/api-prefix';
import { ExtractionService } from './extraction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExtractionJobDto } from './dto/create-extraction-job.dto';

@ApiTags('인스타 추출')
@Controller(`${API_PREFIX}/extraction-jobs`)
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '인스타 공유 -> 추출 & 콘서트 매칭',
    description:
      '인스타 게시글 URL을 받아 공연정보를 추출하고 콘서트와 매칭합니다.',
  })
  async create(@Body() dto: CreateExtractionJobDto) {
    return this.extractionService.createAndWait(dto.instagramUrl);
  }
}
