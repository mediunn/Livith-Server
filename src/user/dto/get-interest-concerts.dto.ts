import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { InterestConcertSort } from 'src/common/enums/interest-concert-sort.enum';
export class GetInterestConcertsDto {
  @ApiProperty({
    description:
      '커서 날짜. sort=CONCERT이면 YYYY.MM.DD, sort=TICKETING이면 ISO 8601 DateTime 문자열을 사용',
    required: false,
    example: '2026.01.01 / 2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  cursorDate?: string;

  @ApiProperty({
    description: '커서 ID (가장 마지막으로 가져온 콘서트의 ID)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  cursorId?: number;

  @ApiProperty({
    description: '가져올 데이터 개수',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  size?: number;

  @ApiProperty({
    description: '정렬 기준 (TICKETING: 티켓팅 날짜, CONCERT: 콘서트 날짜)',
    required: false,
    example: 'TICKETING',
  })
  @IsOptional()
  @IsString()
  sort?: InterestConcertSort;
}
