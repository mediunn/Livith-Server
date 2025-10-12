import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 에러가 발생했습니다.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        // 단순 문자열 메시지인 경우
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        // Nest 기본 HttpException 응답 형태 처리
        const res = exceptionResponse as any;
        message = res.message || message;
        error = res.error || HttpStatus[status] || error;
      }
    } else {
      // 예상치 못한 예외 처리
      error = exception instanceof Error ? exception.name : error;
      message = exception instanceof Error ? exception.message : message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
    });
  }
}
