import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class SetInterestConcertsDto {
  @ApiProperty({
    description: '관심 콘서트 ID 목록',
    example: [1, 2, 3],
  })
  @IsInt({ each: true, message: '각 콘서트 ID는 정수여야 합니다.' })
  @IsArray({ message: '콘서트 ID 목록은 배열이어야 합니다.' })
  @ArrayUnique({ message: '콘서트 ID 목록에는 중복된 값이 있으면 안 됩니다.' })
  concertIds: number[];
}
