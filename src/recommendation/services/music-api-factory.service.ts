import { Injectable } from '@nestjs/common';
import { LastfmApiService } from '../integrations/lastfm/last-fm.api.service';
import { ConfigService } from '@nestjs/config';
import { MusicApiService } from '../interface/music-api.interface';
import { MusicApiProvider } from '../enums/music-api-provider.enum';

@Injectable()
export class MusicApiFactoryService {
  constructor(
    private readonly lastfmService: LastfmApiService,
    private readonly configService: ConfigService,
  ) {}

  getService(): MusicApiService {
    const provider = this.configService.get<MusicApiProvider>(
      'MUSIC_API_PROVIDER',
      MusicApiProvider.LASTFM,
    );

    return this.getServiceByProvider(provider);
  }

  getServiceByProvider(provider: MusicApiProvider): MusicApiService {
    switch (provider) {
      case MusicApiProvider.LASTFM:
      default:
        return this.lastfmService;
    }
  }
}
