import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor() {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET, // 선택 사항
      callbackURL: `${process.env.SERVER_URL}/auth/kakao/callback`,
      passReqToCallback: true, // req 객체를 콜백으로 전달
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    return {
      provider: 'kakao',
      providerId: String(profile.id),
      email: profile._json?.kakao_account?.email,
      kakaoAccessToken: accessToken,
    };
  }
}
