import { PipeTransform, Injectable } from '@nestjs/common';
import { BadRequestException } from '../exceptions/business.exception';
import { ErrorCode } from '../enums/error-code.enum';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
      throw new BadRequestException(ErrorCode.INVALID_ID_FORMAT);
    }
    return val;
  }
}
