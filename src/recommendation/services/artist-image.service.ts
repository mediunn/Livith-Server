import { Injectable, Logger } from "@nestjs/common";
import { YoutubeApiService } from "../integrations/youtube/youtube.api.service";

@Injectable()
export class ArtistImageService{
    private readonly logger = new Logger(ArtistImageService.name);

    constructor(
        private readonly youtubeApiService: YoutubeApiService,
    ){}

    async getArtistImageUrl(artistName: string): Promise<string| null>{
        // Youtube만 시도
        const youtubeImage = await this.youtubeApiService.getArtistImageUrl(artistName);

        if(youtubeImage){
            this.logger.log(`Found YouTube image for ${artistName}`);
            return youtubeImage;
        }

        this.logger.warn(`No YouTube image found for ${artistName}, will use genre default`);
        return null;
    }

}