import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { LastfmApiService } from "../integrations/lastfm/last-fm.api.service";
import { ArtistImageService } from "./artist-image.service";
import { Cron } from "@nestjs/schedule";
import { getLastfmTag } from "../integrations/lastfm/genre-mapping.util";
import { YoutubeApiService } from "../integrations/youtube/youtube.api.service";

@Injectable()
export class ArtistSyncService{
    private readonly logger = new Logger(ArtistSyncService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly lastfmApiService: LastfmApiService,
        private readonly artistImageService: ArtistImageService,
        private readonly youtubeApiService: YoutubeApiService,
    ){}

    // 6개월마다 1일 새벽 2시: 아티스트 목록만 동기화
    @Cron('0 2 1 */6 *')
    async syncRepresentativeArtists(){ 
        this.logger.log('Starting representative artsits sync (every 6 months)');

        try{
            const genres = await this.prismaService.genre.findMany();


            for(const genre of genres){
                await this.syncGenreArtists(genre.id, genre.name);
            }

            this.logger.log('Representative artists sync completed');
        }catch(error){
            this.logger.error('Representative artists sync failed', error);
        }
    }

    private async syncGenreArtists(genreId: number, genreName: string){
        const lastfmTag = getLastfmTag(genreName);

        this.logger.log(`Syncing top 200 artists for genre: ${genreName} (Last.fm tag: ${lastfmTag})`);

        const artists = await this.lastfmApiService.getTopArtistByTag(
            lastfmTag,
            200,
            1
        );

        // DB에 Upsert
        for(const artist of artists){
            await this.prismaService.representativeArtist.upsert({
                where: {
                    genreId_artistName:{
                        genreId: genreId,
                        artistName: artist.name,
                    },
                },
                update:{
                    updatedAt: new Date(),
                },
                create: {
                    genreId: genreId,
                    artistName: artist.name,
                    imgUrl: '',
                },
            });
        }
    }

    @Cron('0 3 * * *')
    async syncArtistImages(){
        const artistsWithoutImage = await this.prismaService.representativeArtist.findMany({
            where: {OR: [{imgUrl: ''}, {imgUrl: null}]},
            take: 95,
            orderBy: {createdAt: 'asc'},
        });

        if(artistsWithoutImage.length === 0){
            return;
        }

        for(const artist of artistsWithoutImage){
            const imgUrl = await this.youtubeApiService.getArtistImageUrl(artist.artistName);

            await this.prismaService.representativeArtist.update({
                where: {id: artist.id},
                data: {imgUrl: imgUrl},
            });

            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}