import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma-v5/prisma.service';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { CookieService } from '../common/utils/cookie.util';
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    KakaoStrategy,
    JwtStrategy,
    AppleStrategy,
    CookieService,
  ],
})
export class AuthModule {}
