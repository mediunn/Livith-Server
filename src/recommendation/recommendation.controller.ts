import { Controller, Post, Logger } from '@nestjs/common';
import { ArtistSyncService } from './services/artist-sync.service';

@Controller('/api/v5/recommendation')
export class RecommendationController {
  private readonly logger = new Logger(RecommendationController.name);

  constructor(
    private readonly artistSyncService: ArtistSyncService,
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

  
}
