import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ConcertResponseDto } from '../concert/dto/concert-response.dto';
import { getDaysUntil } from '../common/utils/date.util';
import { UserResponseDto } from './dto/user-response.dto';

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
    return new UserResponseDto(user);
  }
}
