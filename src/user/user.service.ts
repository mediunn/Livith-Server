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
import { Provider, User } from '@prisma/client';
import { UserGenreResponseDto } from './dto/user-genre-response.dto';
import { UserArtistResponseDto } from './dto/user-artist-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * 유저 검증 (public 메서드)
   */
  async validateUser(userId: number): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }
    if (user.deletedAt) {
      throw new ForbiddenException(ErrorCode.USER_DELETED);
    }

    return user;
  }

  //관심 콘서트 추가
  async setInterestConcert(concertId: number, userId: number) {
    const concert = await this.prismaService.concert.findUnique({
      where: { id: concertId },
    });
    if (!concert) {
      throw new NotFoundException(ErrorCode.CONCERT_NOT_FOUND);
    }

    const user = await this.validateUser(userId);

    await this.prismaService.userInterestConcert.upsert({
      where: { userId_concertId: { userId, concertId } },
      update: {},
      create: {
        userId,
        concertId,
        concertTitle: concert.title,
        userNickname: user.nickname,
      },
    });

    return new ConcertResponseDto(concert);
  }

  //관심 콘서트 목록 조회
  async getInterestConcerts(userId: number) {
    await this.validateUser(userId);

    const items = await this.prismaService.userInterestConcert.findMany({
      where: { userId },
      include: { concert: true },
      orderBy: { createdAt: 'desc' },
    });

    return items.map(
      (item) =>
        new ConcertResponseDto(
          item.concert,
          getDaysUntil(item.concert.startDate),
        ),
    );
  }

  // 관심 콘서트 삭제
  async removeInterestConcert(userId: number) {
    await this.validateUser(userId);

    await this.prismaService.userInterestConcert.deleteMany({
      where: { userId },
    });

    return;
  }

  // 유저 정보 조회
  async getUserInfo(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        userGenres: true,
      },
    });
    await this.validateUser(userId);
    return new UserResponseDto(user);
  }

  //닉네임 변경
  async updateNickname(userId, nickname) {
    await this.validateUser(userId);

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
    await this.validateUser(userId);

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
    await this.validateUser(userId);

    return user.userArtists.map(
      (ua) => new UserArtistResponseDto(ua.artist, userId),
    );
  }

  //유저 취향 장르 설정
  async setUserGenrePreferences(userId: number, genreIds: number[]) {
    await this.validateUser(userId);

    // 장르 존재 여부 확인
    const genres = await this.prismaService.genre.findMany({
      where: { id: { in: genreIds } },
    });

    if (genres.length !== genreIds.length) {
      throw new NotFoundException(ErrorCode.GENRE_NOT_FOUND);
    }

    // 기존 취향 장르 삭제
    await this.prismaService.userGenre.deleteMany({
      where: { userId: userId },
    });

    // 새로운 취향 장르 생성
    const createData = genres.map((genre) => ({
      userId: userId,
      genreId: genre.id,
      genreName: genre.name,
    }));

    await this.prismaService.userGenre.createMany({
      data: createData,
    });

    return genres.map((genre) => new UserGenreResponseDto(genre, userId));
  }

  //유저 취향 아티스트 설정
  async setUserArtistPreferences(userId: number, artistIds: number[]) {
    await this.validateUser(userId);

    // 아티스트 존재 여부 확인
    const artists = await this.prismaService.representativeArtist.findMany({
      where: { id: { in: artistIds } },
    });

    if (artists.length !== artistIds.length) {
      throw new NotFoundException(ErrorCode.ARTIST_NOT_FOUND);
    }

    // 기존 취향 아티스트 삭제
    await this.prismaService.userArtist.deleteMany({
      where: { userId: userId },
    });

    // 새로운 취향 아티스트 생성
    const createData = artists.map((artist) => ({
      userId: userId,
      artistId: artist.id,
      artistName: artist.artistName,
    }));

    await this.prismaService.userArtist.createMany({
      data: createData,
    });

    return artists.map((artist) => new UserArtistResponseDto(artist, userId));
  }
}
