import {
  Controller,
  Post,
  Logger,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ArtistSyncService } from './services/artist-sync.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RecommendationService } from './services/recommendation.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from 'src/common/constants/api-prefix';

@ApiTags('추천')
@Controller(`${API_PREFIX}/recommendation`)
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(
    private readonly artistSyncService: ArtistSyncService,
    private readonly recommendationService: RecommendationService,
  ) {}

  /**
   * 수동: 장르별 대표 아티스트 동기화
   */
  @Post('/sync/artists')
  async syncArtists() {
    this.logger.log('Manual artist sync triggered');
    await this.artistSyncService.syncRepresentativeArtists();
    return {
      success: true,
      message: 'Representative artists sync completed',
    };
  }

  /**
   * 수동: 아티스트 이미지 동기화
   */
  @Post('/sync/images')
  async syncImages() {
    this.logger.log('Manual image sync triggered');
    await this.artistSyncService.syncArtistImages();
    return {
      success: true,
      message: 'Artist images sync completed',
    };
  }

  /**
   * 취향 기반 추천 콘서트 조회
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '취향 기반 콘서트 조회',
    description:
      '유저의 선호 아티스트 기반 유산 아티스트 콘서트를 추천합니다. (최대 20개)',
  })
  @Get('/concerts')
  async getRecommendConcerts(@Request() req) {
    const userId = req.user.userId;

    const concerts =
      await this.recommendationService.getRecommendConcerts(userId);

    return concerts;
  }
}
