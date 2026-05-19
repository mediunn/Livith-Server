import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../enums/error-code.enum';
import { ErrorMessages } from '../constants/error-messages';
import { HTTP_STATUS_MESSAGES } from '../constants/http-status-messages';
import { trace } from '@opentelemetry/api';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    if (response.headersSent) return;

    const traceId = trace.getActiveSpan()?.spanContext().traceId;
    const where = `${request?.method ?? '-'} ${request?.url ?? '-'}`;

    // 1) 의도된 비즈니스 예외
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
        traceId,
      });
    }

    // 2) Prisma 알려진 에러 -> 의미있는 상태코드로 매핑 (이전엔 전부 500)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { status, message } = this.mapPrismaError(exception);
      if (status >= 500) {
        this.logger.error(
          `Prisma ${exception.code} (${where}) traceId=${traceId}`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `Prisma ${exception.code} -> ${status} (${where}) traceId=${traceId}`,
        );
      }
      return response.status(status).json({
        message,
        error: HTTP_STATUS_MESSAGES[status] || 'Error',
        statusCode: status,
        traceId,
      });
    }

    // 3) Nest 기본 HttpException
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      let message = ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];

      if (typeof exceptionResponse === 'string') {
        // 단순 문자열 메시지인 경우
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        // Nest 기본 HttpException 응답 형태 처리
        const m = (exceptionResponse as any).message;
        message = Array.isArray(m) ? m.join(', ') : m || message;
      }
      if (status >= 500) {
        this.logger.error(
          `HttpException ${status} (${where}) traceId=${traceId}`,
          exception.stack,
        );
      }
      return response.status(status).json({
        message,
        error: HTTP_STATUS_MESSAGES[status] || 'Error',
        statusCode: status,
        traceId,
      });
    }

    // 4) 그 외 — 예상치 못한 예외 (이전엔 로그 없이 삼켜지던케이스)
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    this.logger.error(
      `Unhandled exception (${where}) traceId=${traceId}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const message =
      process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? exception.message
        : ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];

    return response.status(status).json({
      message,
      error: HTTP_STATUS_MESSAGES[status] || 'Error',
      statusCode: status,
      traceId,
    });
  }

  private mapPrismaError(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (e.code) {
      case 'P2002': {
        const target = (e.meta?.target as string[] | string) ?? '';
        const fields = Array.isArray(target) ? target.join(', ') : target;
        return {
          status: HttpStatus.CONFLICT,
          message: fields
            ? `이미 존재하는 값입니다. (${fields})`
            : '이미 존재하는 값입니다.',
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: '대상을 찾을 수 없습니다.',
        };
      case 'P2003':
        return {
          status: HttpStatus.CONFLICT,
          message: '연결된 데이터가 있어 처리할 수 없습니다.',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `요청을 처리할 수 없습니다. (${e.code})`,
        };
    }
  }
}
