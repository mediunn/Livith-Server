import { Injectable, Logger } from "@nestjs/common";
import { MusicApiService } from "../../interface/music-api.interface";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
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
   
    async getSimilarArtists(artistName: string): Promise<string[]> {
        try{
            const params: any = {
                method: 'artist.getSimilar',
                artist: artistName,
                api_key: this.apiKey,
                format: 'json',
            };

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
            
            return artists.map((a: any) => a.name);
        }catch(error){
            this.logger.warn(
                `Last.fm getSimilar failed for ${artistName}: ${error.message}`,
            );
            return [];
        }
    }

    async getTopArtistByTag(tag: string, limit: number = 50): Promise<{name: string}[]>{
        try{
            const params: any = {
                method: 'tag.getTopArtists',
                tag: tag,
                limit: limit,
                api_key: this.apiKey,
                format: 'json',
            };

            const response = await firstValueFrom(
                this.httpService.get(this.baseUrl, {params}),
            );

            if(response.data.error){
                this.logger.warn(
                    `Last.fm API error: ${response.data.error} - ${response.data.message}`,
                );
                return [];
            }

            const artists = response.data.topartists?.artist;
            return Array.isArray(artists)
                ? artists.map((a: any) => ({name: a.name}))
                : [];
        }catch(error){
            this.logger.warn(
                `Last.fm getTopArtistByTag failed for ${tag}: ${error.message}`,
            );
        }
    }

    async getGlobalTopArtists(limit: number = 1000, page: number = 1): Promise<{name: string}[]>{
        try{
            const params: any = {
                method: 'chart.getTopArtists',
                limit: limit,
                page: page,
                api_key: this.apiKey,
                format: 'json',
            };

            const response = await firstValueFrom(
                this.httpService.get(this.baseUrl, { params }),
            );

            if(response.data.error){
                this.logger.warn(
                    `Last.fm API error: ${response.data.error}-${response.data.message}`,
                );
                return [];
            }

            const artists = response.data.artists?.artist || [];
            return Array.isArray(artists)
                ? artists.map((a: any) => ({name: a.name}))
                : [];
        }catch(error){
            this.logger.warn(
                `Last.fm getTopArtists failed: ${error.message}`,
            );
            return [];
        }
    }
}