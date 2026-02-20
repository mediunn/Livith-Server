import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ForbiddenException,
  UnauthorizedException,
} from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
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
import { CookieService } from '../common/utils/cookie.util';
import { ConfigService } from '@nestjs/config';
import { API_PREFIX } from '../common/constants/api-prefix';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private cookieService: CookieService,
    private configService: ConfigService,
  ) {}

  @Get(`${API_PREFIX}/auth/kakao/web`)
  async kakaoLoginWeb(@Req() req, @Res() res: Response) {
    // 카카오 로그인 페이지로 리다이렉트
    const nonce = crypto.randomBytes(16).toString('hex');
    // 세션에 nonce 저장
    req.session.kakaoNonce = nonce;

    const state = Buffer.from(JSON.stringify({ nonce })).toString('base64');

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${this.configService.get<string>('KAKAO_CLIENT_ID')}&redirect_uri=${this.configService.get<string>('SERVER_URL')}/auth/kakao/callback&state=${state}`;
    return res.redirect(kakaoAuthUrl);
  }

  @Get(`${API_PREFIX}/auth/apple/web`)
  async appleLoginWeb(@Req() req, @Res() res: Response) {
    const nonce = crypto.randomBytes(16).toString('hex');
    req.session.appleNonce = nonce;
    const state = Buffer.from(JSON.stringify({ nonce })).toString('base64');

    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?response_type=code&response_mode=form_post&client_id=${this.configService.get<string>('APPLE_CLIENT_ID')}&redirect_uri=${this.configService.get<string>('SERVER_URL')}/auth/apple/callback&state=${state}&scope=name email`;
    return res.redirect(appleAuthUrl);
  }

  @Get('auth/kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoCallback(
    @Req() req,
    @Res() res: Response,
    @Query('state') state: string,
  ) {
    this.logger.debug(`[kakaoCallback] 진입 req.user=${JSON.stringify(req.user)}`);

    // state 디코딩
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));

    // CSRF 검증
    if (decoded.nonce !== req.session.kakaoNonce) {
      this.logger.warn('[kakaoCallback] CSRF 검증 실패');
      delete req.session.kakaoNonce;
      const payload = { error: 'CSRF 검증 실패' };
      return sendPostMessagePayload(res, payload);
    }
    delete req.session.kakaoNonce;

    try {
      this.logger.debug('[kakaoCallback] validateOAuthLogin 호출');
      const result = await this.authService.validateOAuthLogin(req.user);
      this.logger.debug(`[kakaoCallback] validateOAuthLogin 결과 isNewUser=${result.isNewUser}`);

      let payload: any;
      if (result.isNewUser) {
        // 신규 유저 -> 회원가입 페이지로 안내
        payload = { isNewUser: true, tempUserData: result.tempUserData };
      } else {
        // 기존 유저 -> 토큰 발급
        // 리프레시 토큰은 httpOnly 쿠키로 저장
        this.cookieService.setRefreshTokenCookie(res, result.refreshToken);
        payload = { accessToken: result.accessToken, isNewUser: false };
      }
      return sendPostMessagePayload(res, payload);
    } catch (error: any) {
      this.logger.error(`[kakaoCallback] 에러: ${error.message}`, error.stack);
      // 여기서 에러 메시지를 팝업으로 전달
      const payload = { error: error.message || '알 수 없는 오류' };
      return sendPostMessagePayload(res, payload);
    }
  }
  @Post('auth/apple/callback')
  @UseGuards(AuthGuard('apple'))
  async appleCallback(@Req() req, @Res() res: Response) {
    try {
      const idToken = req.user.idToken;

      const state = req.body.state;
      const decoded = JSON.parse(
        Buffer.from(state, 'base64').toString('utf-8'),
      );

      if (decoded.nonce !== req.session.appleNonce) {
        delete req.session.appleNonce;
        return sendPostMessagePayload(res, { error: 'CSRF 검증 실패' });
      }
      delete req.session.appleNonce;

      const userInfo = await this.authService.verifyAppleIdentity(idToken);
      const result = await this.authService.validateOAuthLogin(userInfo);

      if (result.isNewUser) {
        return sendPostMessagePayload(res, {
          isNewUser: true,
          tempUserData: result.tempUserData,
        });
      }

      this.cookieService.setRefreshTokenCookie(res, result.refreshToken);
      return sendPostMessagePayload(res, {
        accessToken: result.accessToken,
        isNewUser: false,
      });
    } catch (error: any) {
      return sendPostMessagePayload(res, {
        error: error.message || '애플 로그인 중 오류가 발생했어요',
      });
    }
  }

  @Post(`${API_PREFIX}/auth/kakao/mobile`)
  @ApiOperation({ summary: '카카오 모바일 로그인' })
  @ApiBody({ type: KakaoMobileLoginDto })
  async kakaoLoginMobile(@Body() dto: KakaoMobileLoginDto) {
    // 카카오 사용자 정보 조회
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${dto.accessToken}` },
    });

    if (!userRes.data || !userRes.data.id) {
      throw new ForbiddenException(ErrorCode.KAKAO_USER_INFO_FETCH_HEAD);
    }

    // 서버 JWT + refresh token 발급
    return await this.authService.validateOAuthLogin({
      provider: Provider.kakao,
      providerId: String(userRes.data.id),
      email: userRes.data.kakao_account?.email,
    });
  }

  @Post(`${API_PREFIX}/auth/apple/mobile`)
  @ApiOperation({
    summary: '애플 모바일 로그인',
  })
  @ApiBody({ type: AppleMobileLoginDto })
  async appleLoginMobile(@Body() dto: AppleMobileLoginDto) {
    // 서버에서 Apple 서버로 token 검증
    const userInfo = await this.authService.verifyAppleIdentity(
      dto.identityToken,
    );

    const result = await this.authService.validateOAuthLogin(userInfo);
    return result;
  }

  //토큰 재발급
  @Post(`${API_PREFIX}/auth/refresh`)
  @ApiOperation({
    summary: '토큰 재발급',
    description: '리프레시 토큰으로 새로운 토큰을 발급합니다.',
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  async refresh(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Query('client') client: string,
    @Body() body?: RefreshTokenDto,
  ) {
    const oldRefreshToken = req.cookies.refreshToken || body?.refreshToken;

    if (!oldRefreshToken) {
      throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
    }
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(oldRefreshToken);

    if (client === 'web') {
      // 새로운 리프레시 토큰을 쿠키에 저장
      this.cookieService.setRefreshTokenCookie(res, refreshToken);
      return { accessToken };
    } else if (client === 'mobile') {
      return { accessToken, refreshToken };
    }
  }

  //로그아웃
  @Post(`${API_PREFIX}/auth/logout`)
  @ApiOperation({
    summary: '로그아웃',
    description: '리프레시 토큰을 무효화하고 로그아웃합니다.',
  })
  @ApiBody({ type: RefreshTokenDto })
  async logout(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Query('client') client: string,
    @Body() body?: RefreshTokenDto,
  ) {
    const refreshToken = req.cookies.refreshToken || body?.refreshToken || null;

    if (!refreshToken)
      throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);

    await this.authService.logout(refreshToken);
    if (client === 'web') {
      // 쿠키 삭제
      this.cookieService.clearRefreshTokenCookie(res);
    }
    return { message: '로그아웃 완료' };
  }

  //회원가입
  @Post(`${API_PREFIX}/auth/signup`)
  @ApiOperation({
    summary: '회원가입',
    description: '간편 로그인 이후 닉네임, 이메일 등 추가 정보를 저장합니다.',
  })
  @ApiBody({ type: SignupDto })
  async signup(
    @Res({ passthrough: true }) res,
    @Req() req,
    @Body() body: SignupDto,
    @Query('client') client: string,
  ) {
    const result = await this.authService.signup(
      body.provider,
      body.providerId,
      body.email,
      body.marketingConsent,
      body.nickname,
      client,
      body.preferredGenreIds,
      body.preferredArtistIds,
    );
    if (client === 'web') {
      // 리프레시 토큰은 httpOnly 쿠키로 저장
      this.cookieService.setRefreshTokenCookie(res, result.refreshToken);
    }

    return result;
  }

  //회원 탈퇴
  @Post(`${API_PREFIX}/auth/withdraw`)
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
      this.cookieService.clearRefreshTokenCookie(res);
      return result;
    } catch (error) {
      // 탈퇴 실패 시 쿠키 유지 + 에러 전달
      throw error;
    }
  }
}
