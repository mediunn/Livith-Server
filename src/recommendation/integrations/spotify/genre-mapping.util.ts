export const SPOTIFY_GENRE_TAG_MAPPING: Record<string, string> = {
  JPOP: 'j-pop',
  ROCK_METAL: 'rock',
  RAP_HIPHOP: 'hip-hop',
  POP: 'pop',
  INDIE: 'indie',
};

export function getSpotifyGenreTag(genreType: string): string {
  return SPOTIFY_GENRE_TAG_MAPPING[genreType];
}
