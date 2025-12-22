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

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if(exception instanceof BusinessException){
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      return response.status(status).json(exceptionResponse);
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

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
