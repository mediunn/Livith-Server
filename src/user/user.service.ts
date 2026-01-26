import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/enums/error-code.enum';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getDaysUntil } from '../common/utils/date.util';
import { UserResponseDto } from './dto/user-response.dto';
import { Provider } from '@prisma/client';
import { UserGenreResponseDto } from './dto/user-genre-response.dto';
import { UserArtistResponseDto } from './dto/user-artist-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  //관심 콘서트 설정
  async setInterestConcert(concertId: number, userId: number) {
    // 콘서트 ID가 유효한지 확인
    const concert = await this.prismaService.concert.findUnique({
      where: { id: concertId },
    });
    if (!concert) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    // 유저 ID가 유효한지 확인
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    // 관심 콘서트 설정
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        interestConcertId: concertId,
      },
    });

    return new ConcertResponseDto(concert);
  }

  //관심 콘서트 조회
  async getInterestConcert(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { concert: true },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    if (!user.concert) {
      return null;
    }

    return new ConcertResponseDto(
      user.concert,
      getDaysUntil(user.concert.startDate),
    );
  }

  // 관심 콘서트 삭제
  async removeInterestConcert(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { concert: true },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }
    await this.prismaService.user.update({
      where: { id: userId },
      data: { interestConcertId: { set: null } },
    });

    return;
  }

  // 유저 정보 조회
  async getUserInfo(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        userGenres: true,
        userArtists: true,
      },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }
    return new UserResponseDto(user);
  }

  //닉네임 변경
  async updateNickname(userId, nickname) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    //닉네임 중복 확인
    const duplicate = await this.prismaService.user.findUnique({
      where: { nickname: nickname },
    });

    if (duplicate) {
      throw new BadRequestException(ErrorCode.NICKNAME_ALREADY_EXISTS);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { nickname: nickname },
    });

    return new UserResponseDto(updatedUser);
  }

  //닉네임 중복확인
  async checkNickname(nickname) {
    //닉네임 중복 확인
    const existingUser = await this.prismaService.user.findUnique({
      where: { nickname },
    });
    return { available: !existingUser };
  }

  //탈퇴한 유저 여부 확인
  async checkDeletedUser(providerId: string, provider: Provider) {
    const user = await this.prismaService.user.findUnique({
      where: { providerId, provider },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      const daysSinceDelete =
        (new Date().getTime() - user.deletedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceDelete < 7)
        throw new ForbiddenException(ErrorCode.WITHDRAWAL_PERIOD_NOT_PASSED);
    }
    return {
      message: '정상적인 유저입니다.',
      user: new UserResponseDto(user),
    };
  }

  //유저 취향 장르 조회
  async getUserGenrePreferences(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { userGenres: { include: { genre: true } } },
    });
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    return user.userGenres.map(
      (ug) => new UserGenreResponseDto(ug.genre, userId),
    );
  }

  //유저 취향 아티스트 조회
  async getUserArtistPreferences(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { userArtists: { include: { artist: true } } },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    return user.userArtists.map(
      (ua) => new UserArtistResponseDto(ua.artist, userId),
    );
  }
}
