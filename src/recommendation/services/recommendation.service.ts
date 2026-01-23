import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import { LastfmApiService } from "../integrations/lastfm/last-fm.api.service";
import { ConcertStatus } from "src/common/enums/concert-status.enum";
import { ConcertResponseDto } from "src/concert/dto/concert-response.dto";
import { getDaysUntil } from "src/common/utils/date.util";


@Injectable()
export class RecommendationService{
    private readonly logger = new Logger(RecommendationService.name);

    constructor(
        private readonly prismaService: PrismaService,
        private readonly lastfmApiService: LastfmApiService,
    ){}

    // 추천 콘서트 조회
    async getRecommendConcerts(userId: number){
        // 유저의 선호 아티스트 조회
        const userArtists = await this.prismaService.userArtist.findMany({
            where: {userId},
            include: {artist: true},
            orderBy: {createdAt: 'desc'}
        });

        if(userArtists.length === 0){
            // 장르 기반 추천
            return this.getConcertByUserGenres(userId);
        }

        // 병렬로 유사 아티스트 조회
        const similarArtists = userArtists.map((userArtist) => 
            this.lastfmApiService.getSimilarArtists(userArtist.artistName),
        );

        const simlarArtistArrays = await Promise.all(similarArtists);

        // 모든 유사 아티스트 이름 수집
        const allSimilarArtists = new Set<string>();
        simlarArtistArrays.forEach((artists) => {
            artists.forEach((artist) => allSimilarArtists.add(artist));
        });

        // 유사 아티스트 이름으로 Artist 테이블 조회하여 artistId 찾기
        const artists = await this.prismaService.artist.findMany({
            where: {
                artist: { in: Array.from(allSimilarArtists) },
            },
            select: { id: true },
        });

        const artistIds = artists.map((a) => a.id);

        if (artistIds.length === 0) {
            return this.getConcertByUserGenres(userId);
        }

        // artistId로 콘서트 조회
        const concerts = await this.prismaService.concert.findMany({
        where: {
            artistId: { in: artistIds },
            status: { not: ConcertStatus.CANCELED },
        },
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        take: 20,
        });

        if (concerts.length === 0) {
            return this.getConcertByUserGenres(userId);
        }

        return concerts.map(
            (concert) => new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
        );
    }

    // 장르 기반 추천 
    private async getConcertByUserGenres(userId: number){
        const userGenres = await this.prismaService.userGenre.findMany({
            where: {userId},
            include: {genre: true},
        });

        if(userGenres.length === 0){
            return [];
        }

        const genreIds = userGenres.map((ug) => ug.genreId);

        const concerts = await this.prismaService.concert.findMany({
        where: {
            concertGenre: {
            some: {
                genreId: { in: genreIds },
            },
            },
            status: { not: ConcertStatus.CANCELED },
        },
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        take: 20,
        distinct: ['id'],
        });

        return concerts.map(
            (concert) => new ConcertResponseDto(concert, getDaysUntil(concert.startDate)),
        );
    }
}
