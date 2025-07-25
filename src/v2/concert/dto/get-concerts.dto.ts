import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ConcertFilter } from 'src/v2/common/enums/concert-filter.enum';
export class GetConcertsDto {
  @ApiProperty({
    description: '콘서트 진행 상태',
    default: 'ALL',
    enum: ConcertFilter,
    enumName: 'ConcertFilter',
    example: 'ALL',
    required: true,
  })
  @IsEnum(ConcertFilter, {
    message: 'filter는 NEW | UPCOMING | ALL 중 하나여야 해요',
  })
  filter: ConcertFilter;

  @ApiProperty({
    description: '커서 (id 또는 sortedIndex)',
    default: undefined,
    required: false,
    example: undefined,
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
