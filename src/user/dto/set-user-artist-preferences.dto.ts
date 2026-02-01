import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsNumber } from 'class-validator';

export class SetUserArtistPreferencesDto {
  @ApiProperty({
    description: '설정할 아티스트 ID 목록',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
    maxItems: 3,
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개의 아티스트는 선택해야 합니다.' })
  @ArrayMaxSize(3, { message: '최대 3개의 아티스트만 선택할 수 있습니다.' })
  @IsNumber({}, { each: true, message: '아티스트 ID는 숫자여야 합니다.' })
  artistIds: number[];
}
