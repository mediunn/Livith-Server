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
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Provider } from '@prisma/client';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { WithDrawDto } from './dto/withdraw.dto';
import { sendPostMessagePayload } from '../common/utils/sendPostMessagePayload';
import { AppleMobileLoginDto } from './dto/apple-mobile-login.dto';

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

  @Get('api/v4/auth/apple/web')
  async appleLoginWeb(@Req() req, @Res() res: Response) {
    const nonce = crypto.randomBytes(16).toString('hex');
    req.session.appleNonce = nonce;
    const state = Buffer.from(JSON.stringify({ nonce })).toString('base64');

    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?response_type=code&response_mode=form_post&client_id=${process.env.APPLE_CLIENT_ID}&redirect_uri=${process.env.SERVER_URL}/auth/apple/callback&state=${state}&scope=name email`;
    return res.redirect(appleAuthUrl);
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
    console.log('r', req.session.kakaoNonce);
    // CSRF 검증
    if (decoded.nonce !== req.session.kakaoNonce) {
      delete req.session.kakaoNonce;
      const payload = { error: 'CSRF 검증 실패' };
      return sendPostMessagePayload(res, payload);
    }
    delete req.session.kakaoNonce;

    try {
      const result = await this.authService.validateOAuthLogin(req.user);

      let payload: any;
      if (result.isNewUser) {
        // 신규 유저 -> 회원가입 페이지로 안내
        payload = { isNewUser: true, tempUserData: result.tempUserData };
      } else {
        // 기존 유저 -> 토큰 발급
        // 리프레시 토큰은 httpOnly 쿠키로 저장
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none',
          maxAge: 4 * 24 * 60 * 60 * 1000,
        });
        payload = { accessToken: result.accessToken, isNewUser: false };
      }

      return sendPostMessagePayload(res, payload);
    } catch (error: any) {
      // 여기서 에러 메시지를 팝업으로 전달
      const payload = { error: error.message || '알 수 없는 오류' };
      return sendPostMessagePayload(res, payload);
    }
  }

  @Post('auth/apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req, @Res() res: Response) {
    const idToken = req.user.idToken;

    const state = req.body.state;
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));

    if (decoded.nonce !== req.session.appleNonce) {
      delete req.session.appleNonce;
      return sendPostMessagePayload(res, { error: 'CSRF 검증 실패' });
    }
    delete req.session.appleNonce;

    // 서버에서 Apple 서버로 token 검증
    const userInfo = await this.authService.verifyAppleIdentity(idToken);

    const result = await this.authService.validateOAuthLogin(userInfo);

    if (result.isNewUser) {
      return sendPostMessagePayload(res, {
        isNewUser: true,
        tempUserData: result.tempUserData,
      });
    } else {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge: 4 * 24 * 60 * 60 * 1000,
      });
      return sendPostMessagePayload(res, {
        accessToken: result.accessToken,
        isNewUser: false,
      });
    }
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
    return await this.authService.validateOAuthLogin({
      provider: Provider.kakao,
      providerId: String(userRes.data.id),
      email: userRes.data.kakao_account?.email,
    });
  }

  @Post('api/v4/auth/apple/mobile')
  @ApiOperation({
    summary: '애플 모바일 로그인',
  })
  @ApiBody({ type: AppleMobileLoginDto })
  async appleLoginMobile(@Body() dto) {
    // 서버에서 Apple 서버로 token 검증
    const userInfo = await this.authService.verifyAppleIdentity(
      dto.identityToken,
    );

    const result = await this.authService.validateOAuthLogin(userInfo);
    return result;
  }

  //토큰 재발급
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
        sameSite: 'none',
        maxAge: 4 * 24 * 60 * 60 * 1000, // 4일
      });
      return { accessToken };
    } else if (client === 'mobile') {
      return { accessToken, refreshToken };
    }
  }

  //로그아웃
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
    console.log(refreshToken);
    if (!refreshToken)
      throw new UnauthorizedException('리프레시 토큰이 없습니다');

    await this.authService.logout(refreshToken);
    if (client === 'web') {
      // 쿠키 삭제
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });
    }
    return { message: '로그아웃 완료' };
  }

  //회원가입
  @Post('api/v4/auth/signup')
  @ApiOperation({
    summary: '회원가입',
    description: '간편 로그인 이후 닉네임, 이메일 등 추가 정보를 저장합니다.',
  })
  @ApiBody({ type: SignupDto })
  async signup(
    @Res({ passthrough: true }) res,
    @Req() req,
    @Body() body,
    @Query('client') client: string,
  ) {
    const result = await this.authService.signup(
      body.provider,
      body.providerId,
      body.email,
      body.marketingConsent,
      body.nickname,
      client,
    );
    if (client === 'web') {
      // 리프레시 토큰은 httpOnly 쿠키로 저장
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 배포 환경만 true
        sameSite: 'none',
        maxAge: 4 * 24 * 60 * 60 * 1000, // 4일
      });
    }

    return result;
  }

  //회원 탈퇴
  @Post('api/v4/auth/withdraw')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '회원 탈퇴',
    description: '로그인한 유저를 탈퇴 처리합니다.',
  })
  @ApiBody({ type: WithDrawDto })
  async withdraw(
    @Res({ passthrough: true }) res,
    @Body() body: WithDrawDto,
    @Req() req,
  ) {
    const userId = req.user.userId;

    try {
      const result = await this.authService.withdraw(userId, body.reason);

      // 탈퇴 성공 시 쿠키 삭제
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });

      return result;
    } catch (error) {
      // 탈퇴 실패 시 쿠키 유지 + 에러 전달
      throw error;
    }
  }
}
