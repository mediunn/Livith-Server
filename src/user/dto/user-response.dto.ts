import { User, UserArtist, UserGenre } from '@prisma/client';

export class UserResponseDto {
  id: number;
  interestConcertId: number;
  title: string;
  provider: string;
  providerId: string;
  email: string;
  nickname: string;
  marketingConsent: boolean;
  favoriteGenres: { id: number; name: string }[];
  favoriteArtists: { id: number; name: string }[];

  constructor(
    user: User & { userGenres?: UserGenre[]; userArtists?: UserArtist[] },
  ) {
    this.id = user.id;
    this.interestConcertId = user.interestConcertId;
    this.provider = user.provider;
    this.providerId = user.providerId;
    this.email = user.email;
    this.nickname = user.nickname;
    this.marketingConsent = user.marketingConsent;
    this.favoriteGenres = (user.userGenres || []).map((ug) => ({
      id: ug.genreId,
      name: ug.genreName,
    }));
    this.favoriteArtists = (user.userArtists || []).map((ua) => ({
      id: ua.artistId,
      name: ua.artistName,
    }));
  }
}
