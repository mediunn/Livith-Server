import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsNumber } from 'class-validator';

export class SetUserArtistPreferencesDto {
  @ApiProperty({
    description: '설정할 아티스트 ID 목록',
    example: [1, 2, 3],
    type: [Number],
    maxItems: 3,
  })
  @IsArray()
  @ArrayMaxSize(3, { message: '최대 3개의 아티스트만 선택할 수 있습니다.' })
  @IsNumber({}, { each: true, message: '아티스트 ID는 숫자여야 합니다.' })
  artistIds: number[];
}
