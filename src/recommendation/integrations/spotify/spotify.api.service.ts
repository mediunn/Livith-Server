import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpotifyApiService {
  private readonly logger = new Logger(SpotifyApiService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const response = await firstValueFrom(
      this.httpService.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
    return this.accessToken;
  }

  async getTopArtistsByGenre(
    genre: string,
    limit: number = 100,
  ): Promise<{ name: string; imgUrl: string }[]> {
    try {
      const token = await this.getAccessToken();
      const results: { name: string; imgUrl: string }[] = [];
      const pageSize = 50;
      const pages = Math.ceil(limit / pageSize);

      for (let page = 0; page < pages; page++) {
        const offset = page * pageSize;
        const response = await firstValueFrom(
          this.httpService.get('https://api.spotify.com/v1/search', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              q: `genre: ${genre}`,
              type: 'artist',
              limit: pageSize,
              offset,
            },
          }),
        );

        const artists = response.data.artists?.items ?? [];
        for (const artist of artists) {
          results.push({
            name: artist.name,
            imgUrl: artist.images?.[0]?.url ?? '',
          });
        }

        if (artists.length < pageSize) break; // 더 없으면 중단
      }

      return results;
    } catch (error) {
      this.logger.warn(
        `Spotify getTopArtistsByGenre failed for ${genre}: ${error.message}`,
      );
      return [];
    }
  }
}
