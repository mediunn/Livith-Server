import { User, UserArtist, UserGenre } from '@prisma/client';

export class UserResponseDto {
  id: number;
  title: string;
  provider: string;
  providerId: string;
  email: string;
  nickname: string;
  marketingConsent: boolean;
  hasPreferredGenre: boolean;

  constructor(
    user: User & { userGenres?: UserGenre[]; userArtists?: UserArtist[] },
  ) {
    this.id = user.id;
    this.provider = user.provider;
    this.providerId = user.providerId;
    this.email = user.email;
    this.nickname = user.nickname;
    this.marketingConsent = user.marketingConsent;
    this.hasPreferredGenre = !!user.userGenres && user.userGenres.length > 0;
  }
}
