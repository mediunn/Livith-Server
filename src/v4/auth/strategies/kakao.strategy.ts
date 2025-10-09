import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor() {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET, // 선택 사항
      callbackURL: `${process.env.SERVER_URL}/auth/kakao/callback`,
      passReqToCallback: true, // req를 validate로 전달
    });
  }

  // 로그인 요청 시 state 보내기
  authorizeParams(req: any) {
    const client = req.query.client || 'web';
    const nonce = crypto.randomBytes(16).toString('hex');
    const statePayload = { client, nonce };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');
    return { state };
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    // validate 안에는 req도 들어오므로 state 확인 가능
    return {
      provider: 'kakao',
      providerId: String(profile.id),
      email: profile._json?.kakao_account?.email,
    };
  }
}
