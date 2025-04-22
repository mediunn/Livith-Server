import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetSearchResultsDto {
  @ApiProperty({
    description: '검색어',
    required: true,
    example: 'a',
  })
  @IsString()
  keyword: string;

  @ApiProperty({
    description: '커서(마지막 콘서트의 sortedIndex 값)',
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
