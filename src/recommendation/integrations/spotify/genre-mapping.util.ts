export const SPOTIFY_GENRE_TAG_MAPPING: Record<string, string> = {
  JPOP: 'j-pop',
  ROCK_METAL: 'rock',
  RAP_HIPHOP: 'hip-hop',
  CLASSIC_JAZZ: 'jazz',
  ACOUSTIC: 'accoustic',
  ELECTRONIC: 'electronic',
};

export function getSpotifyGenreTag(genreType: string): string {
  return SPOTIFY_GENRE_TAG_MAPPING[genreType];
}
