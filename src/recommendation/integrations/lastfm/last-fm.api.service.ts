import { Injectable, Logger } from '@nestjs/common';
import { MusicApiService } from '../../interface/music-api.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SwrCache } from '../../utils/swr-cache.util';
import { InFlightCoalescing } from '../../utils/in-flight-coalescing.util';
import { Bottleneck } from '../../utils/bottleneck.util';

const TTL_MS = 1000 * 60 * 60 * 6; // 6시간 fresh
const STALE_TTL_MS = 1000 * 60 * 60 * 18; // 18시간 stale 서빙

@Injectable()
export class LastfmApiService implements MusicApiService {
  private readonly logger = new Logger(LastfmApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  private readonly similarCache = new SwrCache<string[]>();
  private readonly topArtistCache = new SwrCache<{ name: string }[]>();
  private readonly coalescing = new InFlightCoalescing();
  private readonly bottleneck = new Bottleneck({
    maxConcurrent: 3,
    minTime: 200, // 200ms 간격 -> 최대 5 req/s
    maxRetries: 2,
    retryDelay: 500, // 500ms -> 1000ms 지수 백오프
    isRetryable: (err) =>
      err instanceof Error && err.message.startsWith('Last.fm rate limit'),
  });

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('LASTFM_API_KEY');

    if (!this.apiKey) {
      this.logger.warn('LASTFM_API_KEY is not set');
    }
  }

  async getSimilarArtists(artistName: string): Promise<string[]> {
    const key = `similar:${artistName}`;

    // Layer1: SWR Cache
    const cached = this.similarCache.get(key);
    if (cached && !cached.isStale) return cached.data;

    // Layer 2 + 3: InFlightCoalescing -> Bottleneck -> HTTP
    const fetch = () =>
      this.coalescing.wrap(key, () =>
        this.bottleneck.schedule(() => this.fetchSimilarArtists(artistName)),
      );

    if (cached?.isStale) {
      // stale -> 즉시 반환 + 백그라운드 재검증
      fetch()
        .then((data) =>
          this.similarCache.set(key, data, {
            ttl: TTL_MS,
            staleTtl: STALE_TTL_MS,
          }),
        )
        .catch(() => {});
      return cached.data;
    }

    try {
      const data = await fetch();
      this.similarCache.set(key, data, { ttl: TTL_MS, staleTtl: STALE_TTL_MS });
      return data;
    } catch {
      return [];
    }
  }

  private async fetchSimilarArtists(artistName: string): Promise<string[]> {
    const params: any = {
      method: 'artist.getSimilar',
      artist: artistName,
      api_key: this.apiKey,
      format: 'json',
    };

    const response = await firstValueFrom(
      this.httpService.get(this.baseUrl, { params }),
    );

    if (response.data.error) {
      // error 29: rate limit → throw해서 Bottleneck retry 발동
      if (response.data.error === 29) {
        throw new Error(`Last.fm rate limit: ${response.data.message}`);
      }
      this.logger.warn(
        `Last.fm API error: ${response.data.error} - ${response.data.message}`,
      );
      throw new Error(`Last.fm API error: ${response.data.error}`);
    }

    const similarArtists = response.data.similarartists?.artist || [];
    const artists = Array.isArray(similarArtists)
      ? similarArtists
      : similarArtists
        ? [similarArtists]
        : [];

    return artists.map((a: any) => a.name);
  }

  async getTopArtistByTag(
    tag: string,
    limit: number = 50,
  ): Promise<{ name: string }[]> {
    const key = `topArtist:${tag}:${limit}`;

    // Layer 1: SWR Cache
    const cached = this.topArtistCache.get(key);
    if (cached && !cached.isStale) return cached.data;

    // Layer 2 + 3: InFlightCoalescing -> Bottleneck -> HTTP
    const fetch = () =>
      this.coalescing.wrap(key, () =>
        this.bottleneck.schedule(() => this.fetchTopArtistByTag(tag, limit)),
      );

    if (cached?.isStale) {
      fetch()
        .then((data) =>
          this.topArtistCache.set(key, data, {
            ttl: TTL_MS,
            staleTtl: STALE_TTL_MS,
          }),
        )
        .catch(() => {});
      return cached.data;
    }

    try {
      const data = await fetch();
      this.topArtistCache.set(key, data, {
        ttl: TTL_MS,
        staleTtl: STALE_TTL_MS,
      });
      return data;
    } catch {
      return [];
    }
  }

  private async fetchTopArtistByTag(
    tag: string,
    limit: number,
  ): Promise<{ name: string }[]> {
    const params: any = {
      method: 'tag.getTopArtists',
      tag: tag,
      limit: limit,
      api_key: this.apiKey,
      format: 'json',
    };

    const response = await firstValueFrom(
      this.httpService.get(this.baseUrl, { params }),
    );

    if (response.data.error) {
      if (response.data.error === 29) {
        throw new Error(`Last.fm rate limit: ${response.data.message}`);
      }
      this.logger.warn(
        `Last.fm API error: ${response.data.error} - ${response.data.message}`,
      );
      throw new Error(`Last.fm API error: ${response.data.error}`);
    }

    const topartists = response.data.topartists?.artist || [];
    const artists = Array.isArray(topartists)
      ? topartists
      : topartists
        ? [topartists]
        : [];

    return artists.map((a: any) => ({ name: a.name }));
  }
}
