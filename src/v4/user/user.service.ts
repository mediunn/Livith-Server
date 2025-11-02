import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getDaysUntil } from '../common/utils/date.util';
import { UserResponseDto } from './dto/user-response.dto';
import { Provider } from '@prisma/client';

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
      throw new NotFoundException('해당 콘서트가 존재하지 않습니다.');
    }

    // 유저 ID가 유효한지 확인
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('탈퇴한 회원입니다.');
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
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('탈퇴한 회원입니다.');
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
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }
    if (user.deletedAt) {
      throw new ForbiddenException('탈퇴한 회원입니다.');
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
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }
    if (user.deletedAt) {
      throw new ForbiddenException('탈퇴한 회원입니다.');
    }
    return new UserResponseDto(user);
  }

  //닉네임 변경
  async updateNickname(userId, nickname) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }

    if (user.deletedAt) {
      throw new ForbiddenException('탈퇴한 회원입니다.');
    }

    //닉네임 중복 확인
    const duplicate = await this.prismaService.user.findUnique({
      where: { nickname: nickname },
    });

    if (duplicate) {
      throw new BadRequestException('이미 존재하는 닉네임이에요.');
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
      throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    }
    if (user.deletedAt) {
      const daysSinceDelete =
        (new Date().getTime() - user.deletedAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceDelete < 7)
        throw new ForbiddenException('탈퇴 후 7일이 지나지 않았어요');
    }
    return {
      message: '정상적인 유저입니다.',
      user: new UserResponseDto(user),
    };
  }
}
