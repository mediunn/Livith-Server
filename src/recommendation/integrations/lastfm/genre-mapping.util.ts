export const GENRE_TAG_MAPPING: Record<string, string> = {
  JPOP: 'j-pop',
  ROCK_METAL: 'rock',
  RAP_HIPHOP: 'hip hop',
  CLASSIC_JAZZ: 'jazz',
  ACOUSTIC: 'acoustic',
  ELECTRONIC: 'electronic',
};

/**
 * DB의 GenreType enum을 Last.fm API 태그로 변환
 * @param genreType - DB의 장르명
 * @returns Last.fm API에서 사용할 태그명
 */
export function getLastfmTag(genreType: string): string {
  return GENRE_TAG_MAPPING[genreType];
}
