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
      privateKeyString: process.env.APPLE_PRIVATE_KEY,
      callbackURL: `${process.env.SERVER_URL}/auth/apple/callback`,
      passReqToCallback: true,
      scope: ['name', 'email'],
    });
  }
  async validate(
    req: any,
    accessToken: string,
    results: {
      id_token: string;
      refresh_token: string;
      expires_in: number;
      access_token: string;
      token_type: string;
    },
  ) {
    return {
      idToken: results.id_token,
    };
  }
}
