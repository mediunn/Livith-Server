export interface MusicApiService{
    /**
     * 관련 아티스트 조회
     * @param artistName 아티스트 이름
     * @returns 관련 아티스트 리스트
     */
    getSimilarArtists(
        artistName: string,
    ): Promise<string[]>;
}