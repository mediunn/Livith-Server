import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../enums/error-code.enum';
import { ErrorMessages } from '../constants/error-messages';
import { HTTP_STATUS_MESSAGES } from '../constants/http-status-messages';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (response.headersSent) {
      // 이미 응답이 전송된 경우 아무 작업도 하지 않음
      return;
    }

    if (exception instanceof BusinessException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as {
        statusCode: number;
        message: string;
      };

      return response.status(status).json({
        message: exceptionResponse.message,
        error: HTTP_STATUS_MESSAGES[status] || 'Error',
        statusCode: status,
      });
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];

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
      }
    } else {
      // 예상치 못한 예외 처리
      if (process.env.NODE_ENV !== 'production') {
        message = exception instanceof Error ? exception.message : message;
      }
    }

    return response.status(status).json({
      message,
      error: HTTP_STATUS_MESSAGES[status] || 'Error',
      statusCode: status,
    });
  }
}
