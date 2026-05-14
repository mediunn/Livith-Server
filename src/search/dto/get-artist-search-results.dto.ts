import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
export class GetArtistSearchResultsDto {
  @ApiProperty({
    description: '커서 (대표 아티스트 ID)',
    default: undefined,
    required: false,
    example: undefined,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
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

  @ApiProperty({
    description: '검색어',
    required: false,
    example: 'a',
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
