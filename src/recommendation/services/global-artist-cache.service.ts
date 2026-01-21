import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { LastfmApiService } from "../integrations/lastfm/last-fm.api.service";


@Injectable()
export class GlobalArtistCacheService implements OnModuleInit{
    private readonly logger = new Logger(GlobalArtistCacheService.name);
    private cache: string[] = []; // 인메모리 캐시
    private lastUpdated: Date | null = null;
    private readonly CACHE_SIZE = 10000; 
    private readonly PARALLEL_PAGES = 10;
    private readonly ARTISTS_PER_PAGE = 1000;

    constructor(
        private readonly lastfmApiService: LastfmApiService,
    ){}

    async onModuleInit() {
        // 서버 시작 시 초기 캐시 로드
        if(this.isEmpty()){
            this.logger.log('Global chart cache is emppty, loading update ...');
            await this.refreshCache();
        }else{
            this.logger.log(
                `Global chart cache loaded: ${this.cache.length} artists (last updated: ${this.lastUpdated})`,
            );
        }
    }

    // 캐시된 글로벌 인기 아티스트 목록 반환
    getTopArtists(limit: number = 10000): string[]{
        return this.cache.slice(0, limit);
    }

    // 캐시가 비어있는지 확인
    isEmpty(): boolean{
        return this.cache.length === 0;
    }

    // 마지막 업데이트 시간
    getLastUpdated(): Date | null{
        return this.lastUpdated;
    }

    // Last.fm에서 글로벌 차트를 가져와서 캐시 업데이트
    async refreshCache(): Promise<void>{
        try{
            const pagePromises = Array.from({length: this.PARALLEL_PAGES}, (_, i)=>
                this.lastfmApiService.getGlobalTopArtists(this.ARTISTS_PER_PAGE, i+1),
            );

            const pageResults = await Promise.all(pagePromises);

            // 모든 페이지 결과 합치기(중복 제거)
            const allArtistsSet = new Set<string>();

            pageResults.forEach((artists) => {
                artists.forEach((artist) => {
                    allArtistsSet.add(artist.name);
                });
            });

            // Set을 Array로 변환하고 10000개 저장
            this.cache = Array.from(allArtistsSet).slice(0, this.CACHE_SIZE);
            this.lastUpdated = new Date();

            this.logger.log(`Global chart cache updated: ${this.cache.length} artists (from ${this.PARALLEL_PAGES} pages)`);
        }catch(error){
            this.logger.error(`Failed to refresh global chart cache`, error);
        }
    }
}