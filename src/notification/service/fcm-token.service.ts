// src/notification/service/fcm-token.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class FcmTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  /**
   * FCM 토큰 등록/업데이트(upsert)
   */
  async registerFcmToken(userId: number, token: string): Promise<void> {
    await this.userService.validateUser(userId);

    await this.prisma.fcmToken.upsert({
      where: {
        userId_token: {
          userId,
          token,
        },
      },
      update: {
        // Prisma 자동 업데이트(updatedAt)
      },
      create: {
        userId,
        token,
      },
    });
  }

  /**
   * FCM 토큰 삭제
   * token이 있으면 해당 토큰만 삭제하고, 없으면 해당 사용자의 모든 토큰을 삭제
   */
  async deleteFcmToken(userId: number, token?: string): Promise<void> {
    await this.userService.validateUser(userId);

    if (token) {
      // 특정 토큰만 삭제
      await this.prisma.fcmToken.deleteMany({
        where: {
          userId,
          token,
        },
      });
    } else {
      // 해당 사용자의 모든 토큰 삭제
      await this.prisma.fcmToken.deleteMany({
        where: {
          userId,
        },
      });
    }
  }
}
