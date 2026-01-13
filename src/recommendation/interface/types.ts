export interface ArtistSearchResult{
    name: string;
    id?: string; 
    externalId?: string; // 외부 API ID
}

export interface SimilarArtist{
    name: string;
    match?: number;
    id?: string;
    externalId?: string;
}