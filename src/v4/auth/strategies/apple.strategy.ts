import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('APPLE_CLIENT_ID'), // Service ID (웹) / Bundle ID (iOS)
      teamID: configService.get<string>('APPLE_TEAM_ID'),
      keyID: configService.get<string>('APPLE_KEY_ID'),
      privateKeyString: configService.get<string>('APPLE_PRIVATE_KEY'),
      callbackURL: `${configService.get<string>('SERVER_URL')}/auth/apple/callback`,
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
