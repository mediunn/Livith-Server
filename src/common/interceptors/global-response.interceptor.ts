import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class GlobalResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (request.path === '/metrics') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 응답이 null이나 undefined일 경우에도 처리할 수 있도록 기본값을 설정
        const responseData = {
          message: '요청에 성공하였습니다.',
          data: data || null,
          statusCode: context.switchToHttp().getResponse().statusCode,
        };

        // GET 요청에 ETag 캐싱 적용
        if (request.method === 'GET') {
          // ETag 생성 (응답 데이터의 해시값)
          const responseString = JSON.stringify(responseData);
          const etag = crypto
            .createHash('md5')
            .update(responseString)
            .digest('hex');

          // ETag 헤더 설정
          response.setHeader('ETag', `"${etag}"`);

          // 클라이언트의 If-None-Match 헤더 확인
          const clientEtag = request.headers['if-none-match'];

          if (clientEtag && clientEtag === `"${etag}"`) {
            // ETag 일치 시 304 반환
            response.status(304);
            return null;
          }
        }
        return responseData;
      }),
      tap((data) => {
        if (data === null) {
          response.end();
        }
      }),
    );
  }
}
