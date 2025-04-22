import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ConcertStatus } from 'src/common/enums/concert-status.enum';

export class GetConcertsDto {
  @ApiProperty({
    description: '콘서트 진행 상태',
    default: 'ONGOING',
    enum: ConcertStatus,
    enumName: 'ConcertStatus',
    example: 'ONGOING',
    required: true,
  })
  @IsEnum(ConcertStatus, {
    message: 'status는 ONGOING | UPCOMING | COMPLETED 중 하나여야 해요',
  })
  status: ConcertStatus;

  @ApiProperty({
    description: '커서(마지막 콘서트의 ID)',
    default: 0,
    required: false,
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cursor?: number;

  @ApiProperty({
    description: '가져올 데이터 개수',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  size?: number;
}
