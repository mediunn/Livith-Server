import { User } from '@prisma/client';

export class UserResponseDto {
  id: number;
  interestConcertId: number;
  title: string;
  provider: string;
  providerId: string;
  email: string;
  nickname: string;
  marketingConsent: boolean;

  constructor(user: User) {
    this.id = user.id;
    this.interestConcertId = user.interestConcertId;
    this.provider = user.provider;
    this.providerId = user.providerId;
    this.email = user.email;
    this.nickname = user.nickname;
    this.marketingConsent = user.marketingConsent;
  }
}
