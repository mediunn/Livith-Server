import { Test, TestingModule } from "@nestjs/testing";
import { LastfmApiService } from "./integrations/lastfm/last-fm.api.service";
import { GlobalArtistCacheService } from "./services/global-artist-cache.service"
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";



describe('GlobalArtistCacheService', () => {
    let service: GlobalArtistCacheService;
    let lastfmApiService: LastfmApiService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                HttpModule,
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
            ],
            providers: [GlobalArtistCacheService, LastfmApiService],
        }).compile();

        service = module.get<GlobalArtistCacheService>(GlobalArtistCacheService);
        lastfmApiService = module.get<LastfmApiService>(LastfmApiService);
    });

    describe('10000명 캐싱 테스트', () => {
        it('10개 페이지 병렬 처리로 10000개 가져오기', async () => {
            // When
            await service.refreshCache();

            // Then
            const artists = service.getTopArtists();

            expect(artists.length).toBeGreaterThan(0);
            expect(artists.length).toBeLessThanOrEqual(10000);

            console.log(`${artists.length}명 아티스트 캐싱 완료`);
        });

        it('중복 제거 확인', async () => {
            // When
            await service.refreshCache();

            // Then
            const artists = service.getTopArtists();
            const uniqueArtists = new Set(artists);

            expect(artists.length).toBe(uniqueArtists.size);
            console.log(`중복 없음: ${artists.length}명`);
        });
    });

    describe('실제 API 연동 확인', () => {
        it('Last.fm API에서 10개 페이지 데이터 가져오기', async () => {
        // When: 10개 페이지 병렬 호출
        const pagePromises = Array.from({ length: 10 }, (_, i) =>
            lastfmApiService.getGlobalTopArtists(1000, i + 1),
        );

        const pageResults = await Promise.all(pagePromises);

        // Then
        const totalArtists = pageResults.reduce((sum, page) => sum + page.length, 0);
        
        expect(totalArtists).toBeGreaterThan(0);
        expect(totalArtists).toBeLessThanOrEqual(10000);
        
        console.log(`총 ${totalArtists}명 아티스트 가져옴`);
        console.log(`페이지별: ${pageResults.map((p, i) => `Page${i+1}:${p.length}`).join(', ')}`);
        });
    });

    
});