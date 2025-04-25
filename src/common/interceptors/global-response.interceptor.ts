import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 응답이 null이나 undefined일 경우에도 처리할 수 있도록 기본값을 설정
        const response = {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: '요청에 성공하였습니다.',
          data: data || {},
        };
        return response;
      }),
    );
  }
}
