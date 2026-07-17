import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (!request.headers.authorization) {
      return null;
    }

    if (err || info || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
