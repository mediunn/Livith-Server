import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { CookieService } from '../common/utils/cookie.util';
import { PrismaModule } from 'prisma/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [JwtModule.register({}), PrismaModule, HttpModule, MetricsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    KakaoStrategy,
    JwtStrategy,
    AppleStrategy,
    CookieService,
  ],
})
export class AuthModule {}
