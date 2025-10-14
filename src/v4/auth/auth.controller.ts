import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import axios from 'axios';
import * as crypto from 'crypto';
import { KakaoMobileLoginDto } from './dto/kakao-mobile-login.dto';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('api/v4/auth/kakao/web')
  async kakaoLoginWeb(@Req() req, @Res() res: Response) {
    // 카카오 로그인 페이지로 리다이렉트
    const nonce = crypto.randomBytes(16).toString('hex');
    // 세션에 nonce 저장
    req.session.kakaoNonce = nonce;

    const state = Buffer.from(JSON.stringify({ nonce })).toString('base64');

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.SERVER_URL}/auth/kakao/callback&state=${state}`;
    return res.redirect(kakaoAuthUrl);
  }

  @Get('auth/kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @Req() req,
    @Res() res: Response,
    @Query('state') state: string,
  ) {
    // state 디코딩
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));

    console.log('d', decoded);
    console.log('s', state);
    console.log('r', req.session.kakaoNonce);
    // CSRF 검증
    if (decoded.nonce !== req.session.kakaoNonce) {
      console.log('d', decoded);
      console.log('s', state);
      console.log('r', req.session.kakaoNonce);
      console.log('rs', req.session);
      throw new ForbiddenException('CSRF 검증 실패');
    }

    // 세션에서 nonce 삭제
    delete req.session.kakaoNonce;

    const { accessToken, refreshToken, isNewUser } =
      await this.authService.validateOAuthLogin(req.user);

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
  }

  @Post('api/v4/auth/kakao/mobile')
  @ApiOperation({ summary: '카카오 모바일 로그인' })
  @ApiBody({ type: KakaoMobileLoginDto })
  async kakaoLoginMobile(@Body() dto) {
    // 카카오 사용자 정보 조회
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${dto.accessToken}` },
    });

    if (!userRes.data || !userRes.data.id) {
      throw new ForbiddenException('카카오 사용자 정보 조회 실패');
    }

    // 서버 JWT + refresh token 발급
    const { accessToken, refreshToken, isNewUser } =
      await this.authService.validateOAuthLogin({
        provider: Provider.kakao,
        providerId: String(userRes.data.id),
        email: userRes.data.kakao_account?.email, // 동의했으면 email도 가능
      });

    // JSON 반환 → 앱에서 저장
    return { accessToken, refreshToken, isNewUser };
  }

  @Post('api/v4/auth/refresh')
  @ApiOperation({
    summary: '토큰 재발급',
    description: '리프레시 토큰으로 새로운 토큰을 발급합니다.',
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  async refresh(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Query('client') client: string,
    @Body() body,
  ) {
    const oldRefreshToken = req.cookies.refreshToken || body?.refreshToken;

    if (!oldRefreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다');
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
      return { accessToken };
    } else if (client === 'mobile') {
      return { accessToken, refreshToken };
    }
  }

  @Post('api/v4/auth/logout')
  @ApiOperation({
    summary: '로그아웃',
    description: '리프레시 토큰을 무효화하고 로그아웃합니다.',
  })
  @ApiBody({ type: RefreshTokenDto })
  async logout(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Query('client') client: string,
    @Body() body,
  ) {
    const refreshToken = req.cookies.refreshToken || body?.refreshToken || null;
    if (!refreshToken)
      throw new UnauthorizedException('리프레시 토큰이 없습니다');

    await this.authService.logout(refreshToken);
    if (client === 'web') {
      // 쿠키 삭제
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
    return { message: '로그아웃 완료' };
  }
}
