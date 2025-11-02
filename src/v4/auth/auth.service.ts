import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { UserResponseDto } from '../user/dto/user-response.dto';

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
    const user = await this.prisma.user.findFirst({
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
      if (daysSinceDelete < 7) {
        throw new ForbiddenException('탈퇴 후 7일이 지나지 않았어요');
      } else {
        //탈퇴한지 7일이 지났을 때
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            providerId: null,
          },
        });
      }
    }

    // 새 유저이거나 탈퇴한지 7일 지났을 때
    if (!user || user.deletedAt) {
      return {
        isNewUser: true,
        tempUserData: {
          provider: profile.provider,
          providerId: String(profile.providerId),
          email: profile.email,
        },
      };
    }

    //기존 유저
    const { accessToken, refreshToken } = this.getTokens(user.id, user.email);
    // 리프레시 토큰 DB 저장
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken, isNewUser: false };
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

  //회원가입
  async signup(
    provider,
    providerId,
    email,
    marketingConsent,
    nickname,
    client,
  ) {
    //닉네임 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { nickname },
    });

    if (existingUser) {
      throw new BadRequestException('이미 존재하는 닉네임이에요.');
    }

    // 완전 신규 유저 생성
    const user = await this.prisma.user.create({
      data: { provider, providerId, email, nickname, marketingConsent },
    });

    //토큰 발급
    const { accessToken, refreshToken } = this.getTokens(user.id, user.email);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
      },
    });
    if (client === 'web') {
      return {
        user: new UserResponseDto(updatedUser),
        accessToken,
      };
    }
    return {
      user: new UserResponseDto(updatedUser),
      accessToken,
      refreshToken,
    };
  }

  //회원 탈퇴
  async withdraw(userId, reason) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }
    // 이미 탈퇴한 유저 확인
    if (user.deletedAt) {
      throw new BadRequestException('이미 탈퇴한 회원입니다.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          refreshToken: null,
        },
      });

      await tx.resignation.create({
        data: {
          content: reason,
        },
      });
    });
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }
}
