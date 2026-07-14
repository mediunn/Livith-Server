import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '../../common/exceptions/business.exception';
import { ErrorCode } from '../../common/enums/error-code.enum';

@Injectable()
export class WorkerTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-worker-token'];
    const expected = this.configService.get<string>('WORKER_TOKEN');

    if (!expected || token !== expected) {
      throw new UnauthorizedException(ErrorCode.INVALID_WORKER_TOKEN);
    }
    return true;
  }
}
