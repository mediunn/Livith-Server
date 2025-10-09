import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // JWT 토큰 생성
  private getTokens(userId: number, email: string) {
    const accessToken = this.jwtService.sign(
      { userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES,
      },
    );

    const refreshToken = this.jwtService.sign(
      { userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES,
      },
    );

    return { accessToken, refreshToken };
  }

  // OAuth 로그인 처리 및 토큰 발급
  async validateOAuthLogin(profile: any) {
    let user = await this.prisma.user.findFirst({
      where: {
        provider: profile.provider,
        providerId: String(profile.providerId),
      },
    });

    // 탈퇴 기록 확인 후 재가입 가능 처리
    if (user && user.deletedAt) {
      const daysSinceDelete =
        (new Date().getTime() - user.deletedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceDelete < 7)
        throw new ForbiddenException('탈퇴 후 7일이 지나지 않았어요');
    }

    let isNewUser = false;

    // 새 유저 생성
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          provider: profile.provider,
          providerId: String(profile.providerId),
          email: profile.email,
          marketingConsent: 'NO',
        },
      });
      isNewUser = true; // 새 유저임 표시
    }

    const { accessToken, refreshToken } = this.getTokens(user.id, user.email);

    // 리프레시 토큰 DB 저장
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // 프론트로 액세스 토큰만 전달
    return { accessToken, refreshToken, isNewUser };
  }

  // 리프레시 토큰으로 새로운 토큰 발급
  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new UnauthorizedException('리프레시 토큰이 유효하지 않습니다.');
      }

      const { accessToken, refreshToken } = this.getTokens(user.id, user.email);

      // 새 리프레시 토큰 DB 저장
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return { accessToken, refreshToken };
    } catch (e) {
      throw new UnauthorizedException('리프레시 토큰 검증 실패');
    }
  }

  // 로그아웃 처리 (리프레시 토큰 삭제)
  async logout(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { refreshToken: null },
    });
  }
}
