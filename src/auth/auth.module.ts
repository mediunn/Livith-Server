import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { CookieService } from '../common/utils/cookie.util';
import { PrismaService } from 'prisma/prisma.service';
@Module({
  imports: [JwtModule.register({}), AuthModule],
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
