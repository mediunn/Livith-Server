import { ArtistSearchResult, SimilarArtist } from "./types";

export interface MusicApiService{
    /**
     * 아티스트 검색
     * @param artistName 아티스트 이름
     * @returns 검색 결과 
     */
    searchArtist(artistName: string): Promise<ArtistSearchResult | null>;


    /**
     * 관련 아티스트 조회
     * @param artistIdOrName 아티스트 ID or 이름
     * @param limit 최대 개수 
     * @returns 관련 아티스트 리스트
     */
    getSimilarArtists(
        artistIdOrName: string,
        limit?: number,
    ): Promise<SimilarArtist[]>;
}