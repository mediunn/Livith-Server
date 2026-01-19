import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

@Injectable()
export class YoutubeApiService{
    private readonly logger = new Logger(YoutubeApiService.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ){
        this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY');

        if(!this.apiKey){
            this.logger.warn('YOUTUBE_API_KEY is not set');
        }
    }

    async getArtistImageUrl(artistName: string): Promise<string>{
        try{
            const params = {
                part: 'snippet',
                q: `${artistName} official`,
                type: 'channel',
                maxResults: 1, 
                key: this.apiKey,
            };

            const response = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/search`, {params}),
            );

            const items = response.data.items || [];
            if(items.length === 0) return null;

            const thumbnails = items[0].snippet?.thumbnails;
            return thumbnails?.high?.url;
        }catch(error){
            this.logger.warn(
                `YouTube API failed for ${artistName}: ${error.message}`,
            );
            return null;
        }
    }
}