import { Injectable, Logger } from "@nestjs/common";
import { MusicApiService } from "../interface/music-api.interface";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { ArtistSearchResult, SimilarArtist } from "../interface/types";
import { firstValueFrom } from "rxjs";

@Injectable()
export class LastfmApiService implements MusicApiService{
    private readonly logger = new Logger(LastfmApiService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ){
        this.apiKey = this.configService.get<string>('LASTFM_API_KEY');

        if(!this.apiKey){
            this.logger.warn('LASTFM_API_KEY is not set');
        }
    }

    async searchArtist(artistName: string): Promise<ArtistSearchResult | null> {
        try{
            const response = await firstValueFrom(
                this.httpService.get(this.baseUrl, {
                    params: {
                        method: 'artist.search',
                        artist: artistName,
                        api_key: this.apiKey,
                        format: 'json',
                        limit: 1,
                    },
                }),
            );

            const artists = response.data.results?.artistmatches?.artist;
            if(!artists){
                return null;
            }

            const artist = Array.isArray(artists) ? artists[0] : artists;
            return {
                name: artist.name,
                id: artist.mbid || undefined,
                externalId: artist.mbid || undefined,
            };
        }catch(error){
            this.logger.warn(
                `Last.fm search field for ${artistName}: ${error.message}`,
            );
            return null;
        }
    }

    async getSimilarArtists(artistIdOrName: string, limit?: number): Promise<SimilarArtist[]> {
        try{
            const params: any = {
                method: 'artist.getSimilar',
                api_key: this.apiKey,
                format: 'json',
                limit,
            };

            // MBID 형식 체크
            if(
                artistIdOrName.includes('-') &&
                artistIdOrName.match(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                )
            ){
                params.mbid = artistIdOrName;
            }else{
                params.artist = artistIdOrName;
                params.autocorrect = 1;
            }

            const response = await firstValueFrom(
                this.httpService.get(this.baseUrl, {params}),
            );

            // 에러 체크
            if(response.data.error){
                this.logger.warn(
                    `Last.fm API error: ${response.data.error} - ${response.data.message}`,
                );
                return [];
            }

            const similarArtists = response.data.similarartists?.artist || [];
            const artists = Array.isArray(similarArtists)
                ? similarArtists
                : similarArtists
                    ? [similarArtists]
                    : [];
            
            return artists.map((a: any) => ({
                name: a.name,
                match: parseFloat(a.match) || undefined,
                id: a.mbid || undefined,
                externalId: a.mbid || undefined,
            }));
        }catch(error){
            this.logger.warn(
                `Last.fm getSimilar failed for ${artistIdOrName}: ${error.message}`,
            );
            return [];
        }

    }
}