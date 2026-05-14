import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetUserGenrePreferencesDto {
  @ApiProperty({
    description: '설정할 장르 ID 목록',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
    maxItems: 3,
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 장르는 선택해야 합니다.' })
  @ArrayMaxSize(3, { message: '최대 3개의 장르만 선택할 수 있습니다.' })
  @IsNumber({}, { each: true, message: '장르 ID는 숫자여야 합니다.' })
  genreIds: number[];
}
