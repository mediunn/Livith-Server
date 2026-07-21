import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.headers.authorization) {
      return null;
    }

    // 토큰이 잘못된 경우도 비로그인으로 처리
    if (err || info || !user) {
      return null;
    }

    return user;
  }
}
