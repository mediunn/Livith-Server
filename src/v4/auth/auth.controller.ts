import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import * as crypto from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('kakao')
  async kakaoLogin(@Res() res: Response, @Query('client') client: string) {
    // client 정보 + CSRF 방어용 nonce를 state에 넣어서 인코딩
    const statePayload = {
      client: client || 'web',
      nonce: crypto.randomBytes(16).toString('hex'), // CSRF 방어용
    };
    const state = Buffer.from(JSON.stringify(statePayload)).toString('base64');

    // 카카오 로그인 URL로 리다이렉트
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.SERVER_URL}/auth/kakao/callback&state=${state}`;
    return res.redirect(kakaoAuthUrl);
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @Req() req,
    @Res() res: Response,
    @Query('state') state: string,
  ) {
    const { accessToken, refreshToken, isNewUser } =
      await this.authService.validateOAuthLogin(req.user);
    // state 디코딩
    let client = 'mobile';
    if (state) {
      try {
        const decoded = JSON.parse(
          Buffer.from(state, 'base64').toString('utf-8'),
        );
        client = decoded.client || 'mobile';
      } catch (err) {
        console.log('state 디코딩 실패', err);
      }
    }

    if (client === 'web') {
      // 리프레시 토큰은 httpOnly 쿠키로 저장
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 배포 환경만 true
        sameSite: 'strict',
        maxAge: 4 * 24 * 60 * 60 * 1000, // 4일
      });

      return res.send(`
        <html>
          <body>
            <script>
              const payload = ${JSON.stringify({ accessToken, isNewUser })};
              if (window.opener) {
                window.opener.postMessage(payload, '${process.env.FRONTEND_URL}');
                window.close();
              } else {
                window.location.href = '${process.env.FRONTEND_URL}';
              }
            </script>
          </body>
        </html>
      `);
    } else if (client === 'mobile') {
      return res.json({ accessToken, refreshToken, isNewUser });
    }
  }

  @Post('refresh')
  async refresh(
    @Req() req,
    @Res() res: Response,
    @Query('client') client: string,
  ) {
    const oldRefreshToken = req.cookies.refreshToken || req.body?.refreshToken;
    if (!oldRefreshToken) {
      return res.status(401).json({ message: '리프레시 토큰이 없습니다' });
    }
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(oldRefreshToken);

    if (client === 'web') {
      // 새로운 리프레시 토큰을 쿠키에 저장
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 배포 환경만 true
        sameSite: 'strict',
        maxAge: 4 * 24 * 60 * 60 * 1000, // 4일
      });
      return res.json({ accessToken });
    } else if (client === 'mobile') {
      return res.json({ accessToken, refreshToken });
    }
  }

  @Post('logout')
  async logout(
    @Req() req,
    @Res() res: Response,
    @Query('client') client: string,
  ) {
    const refreshToken =
      req.cookies.refreshToken || req.body?.refreshToken || null;
    if (!refreshToken) return res.status(400).json({ message: '토큰 없음' });

    await this.authService.logout(refreshToken);
    if (client === 'web') {
      // 쿠키 삭제
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
    return res.json({ message: '로그아웃 완료' });
  }
}
