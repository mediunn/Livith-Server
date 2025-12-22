import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorCode } from "../enums/error-code.enum";
import { ErrorMessages } from "../constants/error-messages";


export class BusinessException extends HttpException{
    constructor(
        public readonly errorCode: ErrorCode,
        statusCode: HttpStatus = HttpStatus.BAD_REQUEST
    ){
        super(
            {
                statusCode,
                message: ErrorMessages[errorCode],
            },
            statusCode
        );
    }
}

export class NotFoundException extends BusinessException{
    constructor(errorCode: ErrorCode){
        super(errorCode, HttpStatus.NOT_FOUND);
    }
}

export class BadRequestException extends BusinessException {
  constructor(errorCode: ErrorCode) {
    super(errorCode, HttpStatus.BAD_REQUEST);
  }
}

export class ForbiddenException extends BusinessException {
  constructor(errorCode: ErrorCode) {
    super(errorCode, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(errorCode: ErrorCode) {
    super(errorCode, HttpStatus.UNAUTHORIZED);
  }
}