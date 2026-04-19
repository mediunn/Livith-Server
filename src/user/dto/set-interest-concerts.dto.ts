import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class SetInterestConcertsDto {
  @ApiProperty({
    description: '관심 콘서트 ID 목록',
    example: [1, 2, 3],
  })
  @IsInt({ each: true, message: '각 콘서트 ID는 정수여야 합니다.' })
  concertIds: number[];
}
