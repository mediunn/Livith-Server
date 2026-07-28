import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReportFailDto {
  /** 로그로만 쓴다. 재시도 여부를 가르지 않는다. */
  @ApiProperty({ description: '추출 실패 사유', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
