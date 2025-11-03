import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor() {
    super({
      clientID: process.env.APPLE_CLIENT_ID, // Service ID (웹) / Bundle ID (iOS)
      teamID: process.env.APPLE_TEAM_ID,
      keyID: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // env에서 줄바꿈 처리
      callbackURL: `${process.env.SERVER_URL}/auth/apple/callback`,
      passReqToCallback: true,
      scope: ['name', 'email'],
    });
  }

  async validate(req, accessToken, refreshToken, idToken, profile) {
    return {
      provider: 'apple',
      providerId: profile.sub,
      email: profile.email,
      idToken,
    };
  }
}
