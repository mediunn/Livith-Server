import { Injectable } from '@nestjs/common';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { UserResponseDto } from '../user/dto/user-response.dto';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';
import jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@prisma/client';

const REFRESH_TOKEN_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // JWT 토큰 생성
  private getTokens(userId: number, email: string) {
    const accessToken = this.jwtService.sign(
      { userId, email },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { userId, email },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES'),
      },
    );

    return { accessToken, refreshToken };
  }

  // iOS에서 전달된 identityToken 검증
  async verifyAppleIdentity(identityToken: string) {
    // Apple 공개 키 가져오기
    const appleKeysRes = await axios.get('https://appleid.apple.com/auth/keys');
    const appleKeys = appleKeysRes.data.keys;

    // JWT header에서 kid 확인
    const decodedHeader: any = jwt.decode(identityToken, {
      complete: true,
    }).header;

    const key = appleKeys.find((k) => k.kid === decodedHeader.kid);

    if (!key) throw new UnauthorizedException(ErrorCode.APPLE_KEY_NOT_FOUND);
    const pem = jwkToPem(key);
    // JWT 검증
    const payload: any = jwt.verify(identityToken, pem, {
      algorithms: ['RS256'],
    });
    return {
      provider: 'apple',
      providerId: payload.sub,
      email: payload.email,
    };
  }

  // OAuth 로그인 처리 및 토큰 발급
  async validateOAuthLogin(profile: any) {
    const user = await this.prisma.user.findFirst({
      where: {
        provider: profile.provider,
        providerId: String(profile.providerId),
      },
      include: {
        userGenres: true,
        userArtists: true,
      },
    });

    // 탈퇴 기록 확인 후 재가입 가능 처리
    if (user && user.deletedAt) {
      const daysSinceDelete =
        (new Date().getTime() - user.deletedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceDelete < 7) {
        throw new ForbiddenException(ErrorCode.WITHDRAWAL_PERIOD_NOT_PASSED);
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

    // absolute 만료가 없으면 최초 1회 설정
    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS,
    );

    // 리프레시 토큰 DB 저장
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, refreshTokenExpiresAt },
      include: {
        userGenres: true,
        userArtists: true,
      },
    });

    return {
      user: new UserResponseDto(updatedUser),
      accessToken,
      refreshToken,
      isNewUser: false,
    };
  }

  // 리프레시 토큰으로 새로운 토큰 발급
  async refreshToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_INVALID);
      }

      // 토큰 absolute 만료 체크
      if (
        !user.refreshTokenExpiresAt ||
        new Date() > user.refreshTokenExpiresAt
      ) {
        throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_EXPIRED);
      }

      const { accessToken, refreshToken } = this.getTokens(user.id, user.email);

      // 새 리프레시 토큰 DB 저장
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken,
          refreshTokenExpiresAt: new Date(
            Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS,
          ),
        },
      });

      return { accessToken, refreshToken };
    } catch (e) {
      throw new UnauthorizedException(
        ErrorCode.REFRESH_TOKEN_VERIFICATION_FAILED,
      );
    }
  }

  // 로그아웃 처리 (리프레시 토큰 삭제)
  async logout(refreshToken: string) {
    if (!refreshToken) return;

    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { refreshToken: null, refreshTokenExpiresAt: null },
    });
  }

  //회원가입
  async signup(
    provider: Provider,
    providerId: string,
    email: string,
    marketingConsent: boolean,
    nickname: string,
    client,
    preferredGenreIds: number[],
    preferredArtistIds?: number[],
  ) {
    //유저 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { providerId },
    });

    if (existingUser) {
      throw new BadRequestException(ErrorCode.USER_ALREADY_EXISTS);
    }

    //닉네임 중복 확인
    const existingNickname = await this.prisma.user.findUnique({
      where: { nickname },
    });

    if (existingNickname) {
      throw new BadRequestException(ErrorCode.NICKNAME_ALREADY_EXISTS);
    }

    // 완전 신규 유저 생성
    const result = await this.prisma.$transaction(async (tx) => {
      // 유저 생성
      const user = await tx.user.create({
        data: { provider, providerId, email, nickname, marketingConsent },
      });

      // 선호 장르 연결
      if (preferredGenreIds && preferredGenreIds.length > 0) {
        // 먼저 장르 정보를 조회
        const genres = await tx.genre.findMany({
          where: {
            id: { in: preferredGenreIds },
          },
        });

        // 유효하지 않은 장르 ID가 있는지 확인
        if (genres.length !== preferredGenreIds.length) {
          throw new BadRequestException(ErrorCode.GENRE_NOT_FOUND);
        }

        const genreConnections = genres.map((genre) => ({
          userId: user.id,
          genreId: genre.id,
          genreName: genre.name,
        }));

        await tx.userGenre.createMany({
          data: genreConnections,
        });
      }

      // 선호 아티스트 연결
      if (preferredArtistIds && preferredArtistIds.length > 0) {
        // 먼저 대표 아티스트 정보를 조회
        const artists = await tx.representativeArtist.findMany({
          where: {
            id: { in: preferredArtistIds },
          },
        });

        // 유효하지 않은 아티스트 ID가 있는지 확인
        if (artists.length !== preferredArtistIds.length) {
          throw new BadRequestException(ErrorCode.ARTIST_NOT_FOUND);
        }

        const artistConnections = artists.map((artist) => ({
          userId: user.id,
          artistId: artist.id,
          artistName: artist.artistName,
        }));

        await tx.userArtist.createMany({
          data: artistConnections,
        });
      }

      //토큰 발급
      const { accessToken, refreshToken } = this.getTokens(user.id, user.email);

      // 토큰 저장
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          refreshToken,
          refreshTokenExpiresAt: new Date(
            Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS,
          ),
        },
        include: {
          userGenres: true,
          userArtists: true,
        },
      });

      return { user: updatedUser, accessToken, refreshToken };
    });

    if (client === 'web') {
      return {
        user: new UserResponseDto(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    }
    return {
      user: new UserResponseDto(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  //회원 탈퇴
  async withdraw(userId: number, reason: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    // 이미 탈퇴한 유저 확인
    if (user.deletedAt) {
      throw new BadRequestException(ErrorCode.USER_ALREADY_DELETED);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          refreshToken: null,
        },
      });

      await tx.fcmToken.deleteMany({
        where: { userId },
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
